import { createHmac, timingSafeEqual } from 'node:crypto';

export const MATCHBOT_SIGNATURE_HEADER = 'x-matchbot-signature';
export const MATCHBOT_TIMESTAMP_HEADER = 'x-matchbot-timestamp';
export const MATCHBOT_SIGNATURE_TOLERANCE_SECONDS = 300;

export function signMatchbotRequest(secret: string, timestamp: string, rawBody: string): string {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  return `v1=${digest}`;
}

export function verifyMatchbotRequest(input: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  nowSeconds?: number;
}): { ok: true } | { ok: false; reason: 'missing' | 'expired' | 'invalid' } {
  const { secret, timestamp, signature, rawBody } = input;
  if (!timestamp || !signature) return { ok: false, reason: 'missing' };

  const parsedTimestamp = Number(timestamp);
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(parsedTimestamp) || Math.abs(nowSeconds - parsedTimestamp) > MATCHBOT_SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'expired' };
  }

  const expected = signMatchbotRequest(secret, timestamp, rawBody);
  const receivedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (receivedBuffer.length !== expectedBuffer.length) return { ok: false, reason: 'invalid' };

  return timingSafeEqual(receivedBuffer, expectedBuffer)
    ? { ok: true }
    : { ok: false, reason: 'invalid' };
}

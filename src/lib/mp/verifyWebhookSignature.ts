import { createHmac, timingSafeEqual } from 'crypto';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export type VerifyReason =
  | 'missing_signature'
  | 'missing_request_id'
  | 'malformed_signature'
  | 'expired'
  | 'invalid';

export type VerifyResult = { ok: true } | { ok: false; reason: VerifyReason };

export function verifyMpWebhookSignature(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string | null;
  secret: string;
  nowMs?: number;
  toleranceMs?: number;
}): VerifyResult {
  const { signatureHeader, requestIdHeader, dataId, secret } = params;
  const nowMs = params.nowMs ?? Date.now();
  const toleranceMs = params.toleranceMs ?? FIVE_MINUTES_MS;

  if (!signatureHeader) return { ok: false, reason: 'missing_signature' };
  if (!requestIdHeader) return { ok: false, reason: 'missing_request_id' };
  if (!dataId) return { ok: false, reason: 'malformed_signature' };

  const kv = new Map<string, string>();
  for (const part of signatureHeader.split(',')) {
    const trimmed = part.trim();
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    kv.set(trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim());
  }

  const ts = kv.get('ts');
  const v1 = kv.get('v1');
  if (!ts || !v1) return { ok: false, reason: 'malformed_signature' };

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: 'malformed_signature' };
  const tsMs = tsNum * 1000;
  if (Math.abs(nowMs - tsMs) > toleranceMs) return { ok: false, reason: 'expired' };

  const normalizedDataId = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${normalizedDataId};request-id:${requestIdHeader};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  if (expected.length !== v1.length) return { ok: false, reason: 'invalid' };

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(v1, 'utf8');
  const eq = timingSafeEqual(expectedBuf, receivedBuf);

  return eq ? { ok: true } : { ok: false, reason: 'invalid' };
}

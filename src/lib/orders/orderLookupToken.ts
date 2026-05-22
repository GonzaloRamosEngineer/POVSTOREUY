import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_HEX_LEN = 32;

export function signOrderLookupToken(orderId: string, secret: string): string {
  return createHmac('sha256', secret).update(orderId).digest('hex').slice(0, TOKEN_HEX_LEN);
}

export function verifyOrderLookupToken(params: {
  orderId: string | null | undefined;
  token: string | null | undefined;
  secret: string;
}): boolean {
  const { orderId, token, secret } = params;
  if (!orderId || !token) return false;
  const expected = signOrderLookupToken(orderId, secret);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(token, 'utf8'));
}

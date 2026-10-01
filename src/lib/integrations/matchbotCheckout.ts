import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 1;
const TOKEN_TTL_SECONDS = 60 * 60;

export type MatchbotCheckoutIntent = {
  v: 1;
  product_id: string;
  pack_id: string | null;
  quantity: number;
  source: 'matchbot';
  intent_id: string | null;
  exp: number;
};

function signatureFor(secret: string, encodedPayload: string): string {
  return createHmac('sha256', secret)
    .update(`matchbot-checkout.v1.${encodedPayload}`, 'utf8')
    .digest('base64url');
}

export function createMatchbotCheckoutToken(input: {
  secret: string;
  productId: string;
  packId?: string | null;
  quantity?: number;
  nowSeconds?: number;
  intentId?: string | null;
}): string {
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: MatchbotCheckoutIntent = {
    v: TOKEN_VERSION,
    product_id: input.productId,
    pack_id: input.packId || null,
    quantity: Math.min(Math.max(Math.trunc(input.quantity ?? 1), 1), 10),
    source: 'matchbot',
    intent_id: input.intentId || null,
    exp: nowSeconds + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${signatureFor(input.secret, encodedPayload)}`;
}

export function verifyMatchbotCheckoutToken(input: {
  secret: string;
  token: string;
  nowSeconds?: number;
}): { ok: true; intent: MatchbotCheckoutIntent } | { ok: false; reason: 'invalid' | 'expired' } {
  const [encodedPayload, receivedSignature, extra] = String(input.token || '').split('.');
  if (!encodedPayload || !receivedSignature || extra) return { ok: false, reason: 'invalid' };

  const expectedSignature = signatureFor(input.secret, encodedPayload);
  const received = Buffer.from(receivedSignature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: 'invalid' };
  }

  let payload: MatchbotCheckoutIntent;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const quantity = Number(payload?.quantity);
  if (
    payload?.v !== TOKEN_VERSION ||
    payload?.source !== 'matchbot' ||
    (payload.intent_id !== null && (typeof payload.intent_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.intent_id))) ||
    typeof payload?.product_id !== 'string' ||
    !payload.product_id.trim() ||
    (payload.pack_id !== null && typeof payload.pack_id !== 'string') ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 10 ||
    !Number.isInteger(payload?.exp)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp < nowSeconds) return { ok: false, reason: 'expired' };
  return { ok: true, intent: payload };
}

export function createMatchbotCheckoutUrl(input: {
  siteUrl: string;
  secret: string;
  productId: string;
  packId?: string | null;
  quantity?: number;
  intentId?: string | null;
}): string {
  const token = createMatchbotCheckoutToken(input);
  return `${input.siteUrl.replace(/\/$/, '')}/checkout/matchbot?intent=${encodeURIComponent(token)}`;
}

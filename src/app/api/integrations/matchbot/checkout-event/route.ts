import { NextResponse } from 'next/server';
import { verifyMatchbotCheckoutToken } from '@/lib/integrations/matchbotCheckout';
import { notifyMatchbotCommerceEvent, type MatchbotCommerceEvent } from '@/lib/integrations/matchbotCommerce';

const ALLOWED = new Set<MatchbotCommerceEvent>(['opened', 'checkout_started']);

export async function POST(request: Request) {
  const secret = process.env.MATCHBOT_CATALOG_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });

  const body = await request.json().catch(() => null);
  const event = body?.event as MatchbotCommerceEvent;
  if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 });

  const verified = verifyMatchbotCheckoutToken({ secret, token: String(body?.token || '') });
  if (verified.ok === false || !verified.intent.intent_id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const delivered = await notifyMatchbotCommerceEvent({
    intentId: verified.intent.intent_id,
    event,
  });
  return NextResponse.json({ ok: true, delivered });
}

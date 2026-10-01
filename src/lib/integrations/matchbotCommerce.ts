import { createHmac } from 'node:crypto';

export type MatchbotCommerceEvent = 'opened' | 'checkout_started' | 'order_created' | 'paid';

export async function notifyMatchbotCommerceEvent(input: {
  intentId: string;
  event: MatchbotCommerceEvent;
  orderReference?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const url = process.env.MATCHBOT_COMMERCE_EVENTS_URL;
  const secret = process.env.MATCHBOT_CATALOG_SECRET;
  if (!url || !secret || !/^https:\/\//.test(url)) return false;

  const rawBody = JSON.stringify({
    intent_id: input.intentId,
    event: input.event,
    ...(input.orderReference ? { order_reference: input.orderReference } : {}),
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `v1=${createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await (input.fetchImpl ?? fetch)(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-matchbot-timestamp': timestamp,
        'x-matchbot-signature': signature,
      },
      body: rawBody,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

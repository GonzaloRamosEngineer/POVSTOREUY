import { describe, expect, it, vi } from 'vitest';
import { notifyMatchbotCommerceEvent } from './matchbotCommerce';

describe('MatchBot commerce events', () => {
  it('firma y entrega eventos sin incluir datos personales', async () => {
    vi.stubEnv('MATCHBOT_COMMERCE_EVENTS_URL', 'https://matchbot.test/functions/v1/commerce-event');
    vi.stubEnv('MATCHBOT_CATALOG_SECRET', 'secret');
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));

    await expect(notifyMatchbotCommerceEvent({
      intentId: '11111111-1111-4111-8111-111111111111',
      event: 'opened',
      fetchImpl,
    })).resolves.toBe(true);

    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      intent_id: '11111111-1111-4111-8111-111111111111',
      event: 'opened',
    });
    expect(init?.headers).toMatchObject({
      'x-matchbot-timestamp': expect.any(String),
      'x-matchbot-signature': expect.stringMatching(/^v1=[0-9a-f]{64}$/),
    });
  });
});

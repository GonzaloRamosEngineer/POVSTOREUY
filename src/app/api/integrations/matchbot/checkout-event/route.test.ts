import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMatchbotCheckoutToken } from '@/lib/integrations/matchbotCheckout';

const { notify } = vi.hoisted(() => ({ notify: vi.fn(async () => true) }));
vi.mock('@/lib/integrations/matchbotCommerce', () => ({
  notifyMatchbotCommerceEvent: notify,
}));

const { POST } = await import('./route');

describe('POST checkout-event', () => {
  beforeEach(() => {
    process.env.MATCHBOT_CATALOG_SECRET = 'secret';
    notify.mockClear();
  });

  it('acepta sólo eventos de navegador con una intención firmada', async () => {
    const token = createMatchbotCheckoutToken({
      secret: 'secret',
      productId: 'product-1',
      intentId: '11111111-1111-4111-8111-111111111111',
    });
    const response = await POST(new Request('http://localhost/api/integrations/matchbot/checkout-event', {
      method: 'POST',
      body: JSON.stringify({ token, event: 'opened' }),
    }));

    expect(response.status).toBe(200);
    expect(notify).toHaveBeenCalledWith({
      intentId: '11111111-1111-4111-8111-111111111111',
      event: 'opened',
    });
  });

  it('impide que el navegador marque una compra como pagada', async () => {
    const response = await POST(new Request('http://localhost/api/integrations/matchbot/checkout-event', {
      method: 'POST',
      body: JSON.stringify({ token: 'anything', event: 'paid' }),
    }));
    expect(response.status).toBe(400);
    expect(notify).not.toHaveBeenCalled();
  });
});

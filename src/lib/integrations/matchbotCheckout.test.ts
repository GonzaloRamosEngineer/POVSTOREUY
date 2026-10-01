import { describe, expect, it } from 'vitest';
import {
  createMatchbotCheckoutToken,
  createMatchbotCheckoutUrl,
  verifyMatchbotCheckoutToken,
} from './matchbotCheckout';

describe('matchbot checkout intent', () => {
  it('firma y verifica una intención acotada', () => {
    const token = createMatchbotCheckoutToken({
      secret: 'secret',
      productId: 'product-1',
      packId: 'kit-esencial',
      quantity: 2,
      nowSeconds: 100,
      intentId: '11111111-1111-4111-8111-111111111111',
    });
    const result = verifyMatchbotCheckoutToken({ secret: 'secret', token, nowSeconds: 101 });

    expect(result).toEqual({
      ok: true,
      intent: {
        v: 1,
        product_id: 'product-1',
        pack_id: 'kit-esencial',
        quantity: 2,
        source: 'matchbot',
        intent_id: '11111111-1111-4111-8111-111111111111',
        exp: 3700,
      },
    });
  });

  it('rechaza manipulación y vencimiento', () => {
    const token = createMatchbotCheckoutToken({
      secret: 'secret',
      productId: 'product-1',
      nowSeconds: 100,
    });

    expect(verifyMatchbotCheckoutToken({ secret: 'other', token, nowSeconds: 101 })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(verifyMatchbotCheckoutToken({ secret: 'secret', token, nowSeconds: 3701 })).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('construye una URL sin exponer producto ni precio', () => {
    const url = createMatchbotCheckoutUrl({
      siteUrl: 'https://povstore.uy/',
      secret: 'secret',
      productId: 'product-1',
      packId: 'kit-esencial',
    });

    expect(url).toMatch(/^https:\/\/povstore\.uy\/checkout\/matchbot\?intent=/);
    expect(url).not.toContain('product-1');
    expect(url).not.toContain('kit-esencial');
  });
});

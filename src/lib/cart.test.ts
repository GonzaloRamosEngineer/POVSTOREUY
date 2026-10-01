import { describe, expect, it } from 'vitest';
import { cartUnitPrice, type CartItem } from './cart';

const item: CartItem = {
  id: 'pack::p1::kit',
  name: 'Kit Esencial',
  price: 10990,
  cash_price: 10990,
  card_price: 12490,
  quantity: 1,
  image: '/kit.jpg',
  alt: 'Kit Esencial',
};

describe('cartUnitPrice', () => {
  it('muestra el precio real del medio de pago', () => {
    expect(cartUnitPrice(item, 'bank_transfer')).toBe(10990);
    expect(cartUnitPrice(item, 'mercadopago')).toBe(12490);
  });

  it('mantiene compatibilidad con carritos anteriores', () => {
    expect(cartUnitPrice({ ...item, cash_price: null, card_price: null }, 'mercadopago')).toBe(10990);
  });
});

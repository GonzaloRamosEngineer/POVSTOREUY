import { describe, expect, it } from 'vitest';
import { isPickup, isDelivery, PICKUP_ADDRESS } from './deliveryMethod';

describe('isPickup', () => {
  it('returns true when delivery_method === "pickup"', () => {
    expect(isPickup({ delivery_method: 'pickup' })).toBe(true);
  });

  it('returns false when delivery_method === "delivery"', () => {
    expect(isPickup({ delivery_method: 'delivery' })).toBe(false);
  });

  it('returns false for null/undefined order', () => {
    expect(isPickup(null)).toBe(false);
    expect(isPickup(undefined)).toBe(false);
  });

  it('returns false when delivery_method is missing (defensive)', () => {
    expect(isPickup({})).toBe(false);
  });

  it('returns false for unexpected string values (defensive)', () => {
    expect(isPickup({ delivery_method: 'whatever' })).toBe(false);
    expect(isPickup({ delivery_method: '' })).toBe(false);
  });
});

describe('isDelivery', () => {
  it('returns true when delivery_method === "delivery"', () => {
    expect(isDelivery({ delivery_method: 'delivery' })).toBe(true);
  });

  it('returns false when delivery_method === "pickup"', () => {
    expect(isDelivery({ delivery_method: 'pickup' })).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isDelivery(null)).toBe(false);
    expect(isDelivery(undefined)).toBe(false);
  });
});

describe('PICKUP_ADDRESS', () => {
  it('is a non-empty string with calle + ciudad + departamento', () => {
    expect(PICKUP_ADDRESS).toBeTruthy();
    expect(PICKUP_ADDRESS).toMatch(/Rodó/);
    expect(PICKUP_ADDRESS).toMatch(/Montevideo/);
  });
});

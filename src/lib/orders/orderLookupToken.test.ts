import { describe, expect, it } from 'vitest';
import { signOrderLookupToken, verifyOrderLookupToken } from './orderLookupToken';

const SECRET = 'test-secret-do-not-use-in-prod';

describe('orderLookupToken', () => {
  const orderId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('signs and verifies a token round-trip', () => {
    const token = signOrderLookupToken(orderId, SECRET);
    expect(token.length).toBe(32);
    expect(verifyOrderLookupToken({ orderId, token, secret: SECRET })).toBe(true);
  });

  it('rejects null orderId', () => {
    const token = signOrderLookupToken(orderId, SECRET);
    expect(verifyOrderLookupToken({ orderId: null, token, secret: SECRET })).toBe(false);
  });

  it('rejects null token', () => {
    expect(verifyOrderLookupToken({ orderId, token: null, secret: SECRET })).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(verifyOrderLookupToken({ orderId: '', token: '', secret: SECRET })).toBe(false);
  });

  it('rejects a token of wrong length (no timing-safe throw)', () => {
    expect(verifyOrderLookupToken({ orderId, token: 'tooshort', secret: SECRET })).toBe(false);
  });

  it('rejects a tampered token (1 char changed)', () => {
    const token = signOrderLookupToken(orderId, SECRET);
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifyOrderLookupToken({ orderId, token: tampered, secret: SECRET })).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const evilToken = signOrderLookupToken(orderId, 'attacker-guess');
    expect(verifyOrderLookupToken({ orderId, token: evilToken, secret: SECRET })).toBe(false);
  });

  it('rejects a valid token reused for a different orderId', () => {
    const token = signOrderLookupToken(orderId, SECRET);
    const otherOrderId = 'ffffffff-1111-2222-3333-444444444444';
    expect(verifyOrderLookupToken({ orderId: otherOrderId, token, secret: SECRET })).toBe(false);
  });
});

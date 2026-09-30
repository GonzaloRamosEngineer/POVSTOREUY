import { describe, expect, it } from 'vitest';
import { signMatchbotRequest, verifyMatchbotRequest } from './matchbotAuth';

describe('firma del conector MatchBot', () => {
  const secret = 'secreto-de-prueba';
  const timestamp = '1900000000';
  const rawBody = JSON.stringify({ action: 'search', query: 'camara 4k' });

  it('acepta una firma vigente y exacta', () => {
    const signature = signMatchbotRequest(secret, timestamp, rawBody);
    expect(verifyMatchbotRequest({ secret, timestamp, signature, rawBody, nowSeconds: 1900000100 })).toEqual({ ok: true });
  });

  it('rechaza cuerpo alterado, firma ausente y timestamp vencido', () => {
    const signature = signMatchbotRequest(secret, timestamp, rawBody);
    expect(verifyMatchbotRequest({ secret, timestamp, signature, rawBody: `${rawBody} `, nowSeconds: 1900000100 })).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyMatchbotRequest({ secret, timestamp, signature: null, rawBody, nowSeconds: 1900000100 })).toEqual({ ok: false, reason: 'missing' });
    expect(verifyMatchbotRequest({ secret, timestamp, signature, rawBody, nowSeconds: 1900001000 })).toEqual({ ok: false, reason: 'expired' });
  });
});

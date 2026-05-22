import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { verifyMpWebhookSignature } from './verifyWebhookSignature';

const SECRET = 'test-secret-do-not-use-in-prod';

function signManifest(dataId: string, requestId: string, tsSeconds: number, secret = SECRET) {
  const normalized = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${normalized};request-id:${requestId};ts:${tsSeconds};`;
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

describe('verifyMpWebhookSignature', () => {
  const nowMs = 1_700_000_000_000;
  const ts = Math.floor(nowMs / 1000);
  const dataId = '1234567890';
  const requestId = 'a-uuid-here';

  it('accepts a valid signature within the time window', () => {
    const v1 = signManifest(dataId, requestId, ts);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res.ok).toBe(true);
  });

  it('lowercases alphanumeric data.id before signing', () => {
    const upperId = 'ABC123def';
    const v1 = signManifest(upperId, requestId, ts);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: requestId,
      dataId: upperId,
      secret: SECRET,
      nowMs,
    });
    expect(res.ok).toBe(true);
  });

  it('rejects when x-signature header is missing', () => {
    const res = verifyMpWebhookSignature({
      signatureHeader: null,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'missing_signature' });
  });

  it('rejects when x-request-id header is missing', () => {
    const v1 = signManifest(dataId, requestId, ts);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: null,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'missing_request_id' });
  });

  it('rejects when data.id is missing', () => {
    const v1 = signManifest(dataId, requestId, ts);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: requestId,
      dataId: null,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'malformed_signature' });
  });

  it('rejects malformed x-signature (no ts or v1)', () => {
    const res = verifyMpWebhookSignature({
      signatureHeader: 'foo=bar,baz=qux',
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'malformed_signature' });
  });

  it('rejects when ts is non-numeric', () => {
    const res = verifyMpWebhookSignature({
      signatureHeader: 'ts=notanumber,v1=deadbeef',
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'malformed_signature' });
  });

  it('rejects ts older than the tolerance window (replay)', () => {
    const oldTs = ts - 10 * 60;
    const v1 = signManifest(dataId, requestId, oldTs);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${oldTs},v1=${v1}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects ts too far in the future', () => {
    const futureTs = ts + 10 * 60;
    const v1 = signManifest(dataId, requestId, futureTs);
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${futureTs},v1=${v1}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects when v1 is wrong (tampered)', () => {
    const v1 = signManifest(dataId, requestId, ts);
    const tampered = v1.slice(0, -2) + (v1.endsWith('aa') ? 'bb' : 'aa');
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${tampered}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects when v1 length differs from expected (no timing-safe throw)', () => {
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=tooshort`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects when secret is wrong', () => {
    const v1 = signManifest(dataId, requestId, ts, 'attacker-guess');
    const res = verifyMpWebhookSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
      nowMs,
    });
    expect(res).toEqual({ ok: false, reason: 'invalid' });
  });
});

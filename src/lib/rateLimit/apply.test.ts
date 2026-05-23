import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => {
      const headers = new Map<string, string>();
      return {
        status: init?.status ?? 200,
        body,
        headers: {
          set: (k: string, v: string) => headers.set(k.toLowerCase(), v),
          get: (k: string) => headers.get(k.toLowerCase()),
        },
      };
    },
  },
}));

import { applyRateLimit, getClientIp } from './apply';
import { apiErrorMessages } from '@/messages/apiErrorMessages';

function makeRequest(headers: Record<string, string> = {}): Request {
  const h = new Headers();
  for (const [k, v] of Object.entries(headers)) h.set(k, v);
  return new Request('https://example.com/api/test', { method: 'POST', headers: h });
}

function makeLimiter(opts: {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  throws?: Error;
}) {
  return {
    limit: vi.fn(async (_id: string) => {
      if (opts.throws) throw opts.throws;
      return {
        success: opts.success,
        limit: opts.limit ?? 5,
        remaining: opts.remaining ?? (opts.success ? 4 : 0),
        reset: opts.reset ?? Date.now() + 30_000,
      };
    }),
  } as any;
}

describe('getClientIp', () => {
  it('returns first IP from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5, 198.51.100.1' });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.42' });
    expect(getClientIp(req)).toBe('198.51.100.42');
  });

  it('returns "anonymous" when no headers are present', () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe('anonymous');
  });

  it('trims whitespace from forwarded IPs', () => {
    const req = makeRequest({ 'x-forwarded-for': '   203.0.113.5  , 1.2.3.4' });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });
});

describe('applyRateLimit', () => {
  it('no-op when all limiters are null (fail-open / not configured)', async () => {
    const result = await applyRateLimit('1.2.3.4', [null, null]);
    expect(result.blockedResponse).toBeUndefined();
  });

  it('passes through when limiter allows the request', async () => {
    const limiter = makeLimiter({ success: true });
    const result = await applyRateLimit('1.2.3.4', [limiter]);
    expect(result.blockedResponse).toBeUndefined();
    expect(limiter.limit).toHaveBeenCalledWith('1.2.3.4');
  });

  it('returns 429 with diccionario message + headers when limiter blocks', async () => {
    const reset = Date.now() + 60_000;
    const limiter = makeLimiter({ success: false, limit: 5, remaining: 0, reset });
    const result = await applyRateLimit('1.2.3.4', [limiter]);

    expect(result.blockedResponse).toBeDefined();
    expect(result.blockedResponse!.status).toBe(429);
    expect(result.blockedResponse!.body).toEqual({ error: apiErrorMessages.common.rateLimited });
    expect(result.blockedResponse!.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(result.blockedResponse!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(result.blockedResponse!.headers.get('Retry-After')).toMatch(/^\d+$/);
  });

  it('fails open when limiter throws (does not block legit traffic on infra glitch)', async () => {
    const limiter = makeLimiter({ success: false, throws: new Error('Upstash unreachable') });
    const result = await applyRateLimit('1.2.3.4', [limiter]);
    expect(result.blockedResponse).toBeUndefined();
  });

  it('blocks at the first limiter that rejects (short-circuit)', async () => {
    const allow = makeLimiter({ success: true });
    const block = makeLimiter({ success: false, limit: 20, remaining: 0, reset: Date.now() + 10_000 });
    const neverCalled = makeLimiter({ success: true });

    const result = await applyRateLimit('1.2.3.4', [allow, block, neverCalled]);
    expect(result.blockedResponse).toBeDefined();
    expect(result.blockedResponse!.status).toBe(429);
    expect(allow.limit).toHaveBeenCalledOnce();
    expect(block.limit).toHaveBeenCalledOnce();
    expect(neverCalled.limit).not.toHaveBeenCalled();
  });

  it('skips null limiters in mixed lists', async () => {
    const limiter = makeLimiter({ success: true });
    const result = await applyRateLimit('1.2.3.4', [null, limiter, null]);
    expect(result.blockedResponse).toBeUndefined();
    expect(limiter.limit).toHaveBeenCalledOnce();
  });
});

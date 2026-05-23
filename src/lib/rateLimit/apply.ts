// src/lib/rateLimit/apply.ts
//
// Helper para aplicar uno o varios limiters a una request. Fail-open: si el
// limiter es null (sin env vars) o si Upstash tira excepción, deja pasar la
// request y loggea — no queremos bloquear ventas por un glitch de infra.
//
// Server-only.

import { NextResponse } from 'next/server';
import type { Ratelimit } from '@upstash/ratelimit';
import { apiErrorMessages } from '@/messages/apiErrorMessages';

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'anonymous';
}

export type RateLimitCheck = {
  /** Si está presente, el caller debe `return` esta response inmediatamente. */
  blockedResponse?: NextResponse;
};

/**
 * Aplica una lista de limiters secuencialmente. Devuelve `{ blockedResponse }`
 * en el primer limiter que rechace; si todos pasan o todos son null, devuelve
 * objeto vacío y la request continúa.
 *
 * @param identifier  Key del bucket (típicamente IP del cliente).
 * @param limiters    Lista de limiters (acepta `null` — se ignoran).
 */
export async function applyRateLimit(
  identifier: string,
  limiters: (Ratelimit | null)[]
): Promise<RateLimitCheck> {
  for (const limiter of limiters) {
    if (!limiter) continue;

    try {
      const result = await limiter.limit(identifier);
      if (!result.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        const response = NextResponse.json(
          { error: apiErrorMessages.common.rateLimited },
          { status: 429 }
        );
        response.headers.set('X-RateLimit-Limit', String(result.limit));
        response.headers.set('X-RateLimit-Remaining', String(result.remaining));
        response.headers.set('X-RateLimit-Reset', String(result.reset));
        response.headers.set('Retry-After', String(retryAfterSeconds));
        return { blockedResponse: response };
      }
    } catch (err) {
      // Fail-open: loggear y dejar pasar. No bloqueamos ventas por glitch infra.
      console.error('[rateLimit] limiter error, failing open:', err);
    }
  }

  return {};
}

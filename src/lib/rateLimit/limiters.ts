// src/lib/rateLimit/limiters.ts
//
// Limiters por endpoint público. Configurados con los valores acordados en CLAUDE.md
// ("Próximos pasos recomendados" → rate-limit). Cada endpoint puede combinar varios
// limiters (corto + largo plazo) — el caller verifica ambos.
//
// Server-only.

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from './client';

type LimiterKey =
  | 'createOrder:min'
  | 'createOrder:hour'
  | 'mpPreference:min'
  | 'newsletter:min'
  | 'newsletter:day';

const cache = new Map<LimiterKey, Ratelimit>();

function build(key: LimiterKey, limit: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const cached = cache.get(key);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `povstore:rl:${key}`,
    analytics: false,
  });
  cache.set(key, limiter);
  return limiter;
}

export function getCreateOrderLimiters() {
  return {
    perMinute: build('createOrder:min', 5, '1 m'),
    perHour: build('createOrder:hour', 20, '1 h'),
  };
}

export function getMpPreferenceLimiter() {
  return build('mpPreference:min', 20, '1 m');
}

export function getNewsletterLimiters() {
  return {
    perMinute: build('newsletter:min', 3, '1 m'),
    perDay: build('newsletter:day', 10, '1 d'),
  };
}

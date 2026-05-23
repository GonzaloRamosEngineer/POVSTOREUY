// src/lib/rateLimit/client.ts
//
// Cliente Upstash Redis singleton (REST-based, sin penalty en cold starts).
// Devuelve `null` cuando faltan env vars — el caller debe manejar fail-open.
//
// Server-only.

import { Redis } from '@upstash/redis';

let cachedClient: Redis | null = null;
let warned = false;

export function getRedisClient(): Redis | null {
  if (cachedClient) return cachedClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warned) {
      // Una sola vez por proceso para no inundar logs.
      console.warn(
        '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN ausentes — rate-limit deshabilitado (fail-open).'
      );
      warned = true;
    }
    return null;
  }

  cachedClient = new Redis({ url, token });
  return cachedClient;
}

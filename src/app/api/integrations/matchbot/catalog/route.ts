import { NextResponse } from 'next/server';
import {
  MATCHBOT_SIGNATURE_HEADER,
  MATCHBOT_TIMESTAMP_HEADER,
  verifyMatchbotRequest,
} from '@/lib/integrations/matchbotAuth';
import { queryLiveCatalog } from '@/lib/integrations/catalogService';

export const dynamic = 'force-dynamic';

const json = (status: number, body: unknown) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const secret = process.env.MATCHBOT_CATALOG_SECRET;
  if (!secret) return json(503, { ok: false, error: 'integration_not_configured' });

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return json(413, { ok: false, error: 'request_too_large' });
  }

  const rawBody = await request.text();
  if (rawBody.length > 4096) return json(413, { ok: false, error: 'request_too_large' });
  const auth = verifyMatchbotRequest({
    secret,
    timestamp: request.headers.get(MATCHBOT_TIMESTAMP_HEADER),
    signature: request.headers.get(MATCHBOT_SIGNATURE_HEADER),
    rawBody,
  });
  if (auth.ok === false) return json(401, { ok: false, error: `signature_${auth.reason}` });

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const action = (body as any)?.action;
  const query = typeof (body as any)?.query === 'string' ? (body as any).query.trim() : '';
  const requestedLimit = Number((body as any)?.limit ?? 5);
  const rawIntentId = (body as any)?.context?.intent_id;
  const intentId = typeof rawIntentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawIntentId)
    ? rawIntentId
    : null;
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 5;
  if (action !== 'search') return json(400, { ok: false, error: 'unsupported_action' });
  if (!query || query.length > 500) return json(400, { ok: false, error: 'invalid_query' });

  let products;
  try {
    products = await queryLiveCatalog(query, limit, intentId);
  } catch {
    return json(500, { ok: false, error: 'catalog_unavailable' });
  }

  return json(200, {
    ok: true,
    tool: 'catalog.search',
    products,
    generated_at: new Date().toISOString(),
  });
}

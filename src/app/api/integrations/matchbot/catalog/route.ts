import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  MATCHBOT_SIGNATURE_HEADER,
  MATCHBOT_TIMESTAMP_HEADER,
  verifyMatchbotRequest,
} from '@/lib/integrations/matchbotAuth';
import { searchCatalogRows, type CatalogProductRow } from '@/lib/integrations/catalogSearch';

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
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 5;
  if (action !== 'search') return json(400, { ok: false, error: 'unsupported_action' });
  if (!query || query.length > 500) return json(400, { ok: false, error: 'invalid_query' });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, model, description, price, cash_price, card_price, stock_count, stock_status')
    .eq('is_active', true)
    .limit(250);

  if (error) return json(500, { ok: false, error: 'catalog_unavailable' });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://povstore.uy').replace(/\/$/, '');
  const products = searchCatalogRows(query, (data ?? []) as CatalogProductRow[], limit).map((product) => ({
    id: product.id,
    name: String(product.name ?? ''),
    model: product.model ? String(product.model) : null,
    price: Number(product.price ?? 0),
    cash_price: product.cash_price == null ? null : Number(product.cash_price),
    card_price: product.card_price == null ? null : Number(product.card_price),
    stock_count: Math.max(0, Number(product.stock_count ?? 0)),
    stock_status: product.stock_status ?? null,
    url: `${siteUrl}/products/${product.slug || product.id}`,
  }));

  return json(200, {
    ok: true,
    tool: 'catalog.search',
    products,
    generated_at: new Date().toISOString(),
  });
}

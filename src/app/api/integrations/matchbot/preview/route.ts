import { NextResponse } from 'next/server';
import { queryLiveCatalog } from '@/lib/integrations/catalogService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.MATCHBOT_PREVIEW_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (!query || query.length > 500) {
    return NextResponse.json({ ok: false, error: 'invalid_query' }, { status: 400 });
  }

  try {
    const products = await queryLiveCatalog(query, 5);
    return NextResponse.json({ ok: true, products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'catalog_unavailable' }, { status: 500 });
  }
}

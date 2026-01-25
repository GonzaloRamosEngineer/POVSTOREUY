import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getBearerToken(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!h.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim();
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, res: json(401, { error: 'Missing Authorization Bearer token' }) };

  const supabase = getSupabaseAdmin();

  const { data: userData, error: uErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (uErr || !user) return { ok: false as const, res: json(401, { error: 'Invalid session token' }) };

  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (pErr || !profile) return { ok: false as const, res: json(403, { error: 'Profile not found' }) };
  if (profile.role !== 'admin') return { ok: false as const, res: json(403, { error: 'Admin role required' }) };

  return { ok: true as const, supabase };
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const includeInactive = (url.searchParams.get('includeInactive') || 'true') === 'true';

  let query = auth.supabase
    .from('products')
    .select('id, name, model, price, original_price, stock_count, stock_status, is_active, updated_at')
    .order('updated_at', { ascending: false });

  if (!includeInactive) query = query.eq('is_active', true);

  if (q) {
    // ilike name/model
    query = query.or(`name.ilike.%${q}%,model.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) return json(500, { error: `DB error: ${error.message}` });

  // normalización numérica
  const products = (data || []).map((p: any) => ({
    ...p,
    price: Number(p.price || 0),
    original_price: p.original_price !== null ? Number(p.original_price) : null,
    stock_count: Number(p.stock_count || 0),
  }));

  return json(200, { products });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  // --- ACTUALIZACIÓN: Agregamos gallery, video_url, colors y addon_ids ---
  const payload = {
    name: String(body?.name || '').trim(),
    model: String(body?.model || '').trim(),
    description: String(body?.description || '').trim(),
    price: Number(body?.price || 0),
    original_price: body?.original_price === null || body?.original_price === undefined || body?.original_price === ''
      ? null
      : Number(body?.original_price),
    image_url: String(body?.image_url || '').trim(),
    
    // Arrays y Multimedia
    gallery: Array.isArray(body?.gallery) ? body.gallery : [],
    video_url: body?.video_url ? String(body.video_url).trim() : null,
    
    // --- NUEVOS CAMPOS ---
    colors: Array.isArray(body?.colors) ? body.colors : [],
    addon_ids: Array.isArray(body?.addon_ids) ? body.addon_ids : [],
    // ---------------------

    show_on_home: body.show_on_home !== undefined ? Boolean(body.show_on_home) : true,

    stock_count: Number(body?.stock_count || 0),
    features: Array.isArray(body?.features) ? body.features : [],
    badge: body?.badge ? String(body.badge).trim() : null,
    is_active: Boolean(body?.is_active),
  };

  if (!payload.name || !payload.model || !payload.description || !payload.image_url) {
    return json(400, { error: 'Missing required fields: name, model, description, image_url' });
  }

  if (Number.isNaN(payload.price) || payload.price < 0) return json(400, { error: 'Invalid price' });
  if (Number.isNaN(payload.stock_count) || payload.stock_count < 0) return json(400, { error: 'Invalid stock_count' });

  if (payload.original_price !== null && (Number.isNaN(payload.original_price) || payload.original_price < payload.price)) {
    return json(400, { error: 'original_price must be null or >= price' });
  }

  const { data, error } = await auth.supabase.from('products').insert(payload).select('*').single();
  if (error) return json(500, { error: `DB insert error: ${error.message}` });

  return json(201, { product: data });
}
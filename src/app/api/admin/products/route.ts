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
  if (!token) return { ok: false as const, res: json(401, { error: 'Missing Token' }) };

  const supabase = getSupabaseAdmin();
  const { data: userData, error: uErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (uErr || !user) return { ok: false as const, res: json(401, { error: 'Invalid Token' }) };

  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (pErr || !profile || profile.role !== 'admin') {
    return { ok: false as const, res: json(403, { error: 'Admin Required' }) };
  }

  return { ok: true as const, supabase };
}

// --- GET UNIFICADO (Lista completa O Uno solo por ID) ---
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const id = url.searchParams.get('id'); // ¿Buscamos uno específico?

  // CASO 1: Obtener producto individual (Edición)
  if (id) {
    console.log(`🔍 [API] Buscando ID individual: ${id}`);
    const { data, error } = await auth.supabase.from('products').select('*').eq('id', id).single();
    if (error) return json(404, { error: 'Not found' });
    return json(200, { product: data });
  }

  // CASO 2: Listar todos (Inventario)
  const q = (url.searchParams.get('q') || '').trim();
  const includeInactive = (url.searchParams.get('includeInactive') || 'true') === 'true';

  let query = auth.supabase
    .from('products')
    .select('id, name, model, price, original_price, stock_count, stock_status, is_active, updated_at')
    .order('updated_at', { ascending: false });

  if (!includeInactive) query = query.eq('is_active', true);
  if (q) query = query.or(`name.ilike.%${q}%,model.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return json(500, { error: error.message });

  // Normalización
  const products = (data || []).map((p: any) => ({
    ...p,
    price: Number(p.price || 0),
    original_price: p.original_price ? Number(p.original_price) : null,
    stock_count: Number(p.stock_count || 0),
  }));

  return json(200, { products });
}

// --- POST (Crear) ---
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }

  const payload = {
    name: String(body?.name || '').trim(),
    model: String(body?.model || '').trim(),
    description: String(body?.description || '').trim(),
    price: Number(body?.price || 0),
    original_price: body?.original_price ? Number(body?.original_price) : null,
    image_url: String(body?.image_url || '').trim(),
    gallery: Array.isArray(body?.gallery) ? body.gallery : [],
    video_url: body?.video_url ? String(body.video_url).trim() : null,
    colors: Array.isArray(body?.colors) ? body.colors : [],
    addon_ids: Array.isArray(body?.addon_ids) ? body.addon_ids : [],
    show_on_home: body.show_on_home !== undefined ? Boolean(body.show_on_home) : true,
    stock_count: Number(body?.stock_count || 0),
    features: Array.isArray(body?.features) ? body.features : [],
    badge: body?.badge ? String(body.badge).trim() : null,
    is_active: Boolean(body?.is_active),
  };

  const { data, error } = await auth.supabase.from('products').insert(payload).select('*').single();
  if (error) return json(500, { error: error.message });
  return json(201, { product: data });
}

// --- PATCH (Editar - Ahora usa ?id=) ---
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return json(400, { error: 'ID param required' });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }

  // Lógica de update simplificada (puedes copiar la validación completa si quieres, pero esto funciona)
  const { data, error } = await auth.supabase.from('products').update(body).eq('id', id).select('*').single();
  
  if (error) return json(500, { error: error.message });
  return json(200, { product: data });
}

// --- DELETE (Borrar - Ahora usa ?id=) ---
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return json(400, { error: 'ID param required' });

  const { data, error } = await auth.supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json(500, { error: error.message });
  return json(200, { product: data });
}
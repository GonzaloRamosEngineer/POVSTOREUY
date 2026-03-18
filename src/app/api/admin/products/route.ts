import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { validatePackContracts } from '@/lib/packs/packContractValidator';

export const dynamic = 'force-dynamic';

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function hasOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function collectComponentProductIds(packs: Array<{ components: Array<{ product_id: string }> }>) {
  const ids = new Set<string>();
  for (const pack of packs || []) {
    for (const c of pack?.components || []) {
      const id = String(c?.product_id || '').trim();
      if (id) ids.add(id);
    }
  }
  return Array.from(ids);
}

async function validateComponentProductsActive(ids: string[], supabase: any) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)));
  if (uniqueIds.length === 0) return { ok: true as const };

  const { data, error } = await supabase
    .from('products')
    .select('id, is_active')
    .in('id', uniqueIds);

  if (error) {
    return {
      ok: false as const,
      status: 500,
      body: { error: 'Failed to validate pack component products', details: error.message },
    };
  }

  const byId = new Map<string, any>((data || []).map((p: any) => [String(p.id), p]));

  for (const id of uniqueIds) {
    const product = byId.get(id);
    if (!product) {
      return {
        ok: false as const,
        status: 400,
        body: { error: 'PACK_COMPONENT_NOT_FOUND', details: { product_id: id } },
      };
    }
    if (!product.is_active) {
      return {
        ok: false as const,
        status: 400,
        body: { error: 'PACK_COMPONENT_INACTIVE', details: { product_id: id } },
      };
    }
  }

  return { ok: true as const };
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
  const id = url.searchParams.get('id');

  // CASO 1: Obtener producto individual (Edición)
  if (id) {
    const { data, error } = await auth.supabase.from('products').select('*').eq('id', id).single();
    if (error) return json(404, { error: 'Not found' });
    return json(200, { product: data });
  }

  // CASO 2: Listar todos (Inventario)
  const q = (url.searchParams.get('q') || '').trim();
  const includeInactive = (url.searchParams.get('includeInactive') || 'true') === 'true';

  let query = auth.supabase
    .from('products')
    // NUEVO: Agregamos cash_price y card_price al selector
    .select('id, name, model, price, original_price, cash_price, card_price, stock_count, stock_status, is_active, updated_at')
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
    cash_price: p.cash_price ? Number(p.cash_price) : null,
    card_price: p.card_price ? Number(p.card_price) : null,
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

  if (body?.packs !== undefined && !Array.isArray(body.packs)) {
    return json(400, { error: 'Invalid packs: expected array when provided' });
  }

  if (Array.isArray(body?.packs)) {
    const structural = validatePackContracts(body.packs);
    if (!structural.ok) {
      return json(400, {
        error: 'Invalid pack contract',
        details: structural.errors,
      });
    }

    const isPublishable = Boolean(body?.is_active);
    if (isPublishable && structural.normalized.length > 0) {
      const componentIds = collectComponentProductIds(structural.normalized as any);
      const dbValidation = await validateComponentProductsActive(componentIds, auth.supabase);
      if (!dbValidation.ok) return json(dbValidation.status, dbValidation.body);
    }
  }

  const payload = {
    name: String(body?.name || '').trim(),
    slug: body?.slug ? String(body.slug).trim() : null,
    model: String(body?.model || '').trim(),
    description: String(body?.description || '').trim(),
    price: Number(body?.price || 0), // Se mantiene para compatibilidad con lógica base
    original_price: body?.original_price ? Number(body?.original_price) : null,
    cash_price: body?.cash_price ? Number(body?.cash_price) : null, // NUEVO CAMPO
    card_price: body?.card_price ? Number(body?.card_price) : null, // NUEVO CAMPO
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
    packs: Array.isArray(body?.packs) ? body.packs : undefined,
  };

  const { data, error } = await auth.supabase.from('products').insert(payload).select('*').single();
  if (error) return json(500, { error: error.message });
  return json(201, { product: data });
}

// --- PATCH (Editar) ---
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return json(400, { error: 'ID param required' });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }

  const hasPacksField = hasOwn(body, 'packs');
  if (hasPacksField && !Array.isArray(body.packs)) {
    return json(400, { error: 'Invalid packs: expected array when provided' });
  }

  if (hasPacksField) {
    const structural = validatePackContracts(body.packs);
    if (!structural.ok) {
      return json(400, {
        error: 'Invalid pack contract',
        details: structural.errors,
      });
    }

    const { data: currentProduct, error: currentErr } = await auth.supabase
      .from('products')
      .select('id, is_active')
      .eq('id', id)
      .single();

    if (currentErr || !currentProduct) {
      return json(404, { error: 'Not found' });
    }

    const finalIsActive = hasOwn(body, 'is_active') ? Boolean(body.is_active) : Boolean(currentProduct.is_active);
    if (finalIsActive && structural.normalized.length > 0) {
      const componentIds = collectComponentProductIds(structural.normalized as any);
      const dbValidation = await validateComponentProductsActive(componentIds, auth.supabase);
      if (!dbValidation.ok) return json(dbValidation.status, dbValidation.body);
    }
  }

  const { data, error } = await auth.supabase.from('products').update(body).eq('id', id).select('*').single();
  
  if (error) return json(500, { error: error.message });
  return json(200, { product: data });
}

// --- DELETE (Borrar) ---
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
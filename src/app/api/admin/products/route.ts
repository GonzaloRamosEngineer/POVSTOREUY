import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { validatePackContracts } from '@/lib/packs/packContractValidator';
// IMPORTAMOS EL DICCIONARIO
import { adminProductsApiMessages } from '@/messages/adminProductsApiMessages';

export const dynamic = 'force-dynamic';

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function hasOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

/**
 * Quita el campo `stock` de cada pack antes de persistirlo.
 * El stock de un pack es derivado (ver src/lib/packs/computePackStock.ts); guardarlo
 * en JSONB crea una segunda fuente de verdad que diverge. Defensa en profundidad:
 * aunque la UI ya no manda el campo, otros clientes (curl/postman/scripts) podrían.
 */
function sanitizePacksForPersistence(packs: any): any {
  if (!Array.isArray(packs)) return packs;
  return packs.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const { stock, ...rest } = p as Record<string, any>;
    return rest;
  });
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
  const { validation } = adminProductsApiMessages;
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
      body: { error: validation.packValidateError, details: error.message },
    };
  }

  const byId = new Map<string, any>((data || []).map((p: any) => [String(p.id), p]));

  for (const id of uniqueIds) {
    const product = byId.get(id);
    if (!product) {
      return {
        ok: false as const,
        status: 400,
        body: { error: validation.packComponentNotFound, details: { product_id: id } },
      };
    }
    if (!product.is_active) {
      return {
        ok: false as const,
        status: 400,
        body: { error: validation.packComponentInactive, details: { product_id: id } },
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
  const { auth: authMsgs } = adminProductsApiMessages;
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, res: json(401, { error: authMsgs.missingToken }) };

  const supabase = getSupabaseAdmin();
  const { data: userData, error: uErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (uErr || !user) return { ok: false as const, res: json(401, { error: authMsgs.invalidToken }) };

  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (pErr || !profile || profile.role !== 'admin') {
    return { ok: false as const, res: json(403, { error: authMsgs.adminRequired }) };
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
    if (error) return json(404, { error: adminProductsApiMessages.responses.notFound });
    return json(200, { product: data });
  }

  // CASO 2: Listar todos (Inventario)
  const q = (url.searchParams.get('q') || '').trim();
  const includeInactive = (url.searchParams.get('includeInactive') || 'true') === 'true';

  let query = auth.supabase
    .from('products')
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

  const { validation } = adminProductsApiMessages;

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: validation.invalidJson }); }

  if (body?.packs !== undefined && !Array.isArray(body.packs)) {
    return json(400, { error: validation.invalidPacksArray });
  }

  if (Array.isArray(body?.packs)) {
    const structural = validatePackContracts(body.packs);
    if (!structural.ok) {
      return json(400, {
        error: validation.invalidPackContract,
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
    price: Number(body?.price || 0), 
    original_price: body?.original_price ? Number(body?.original_price) : null,
    cash_price: body?.cash_price ? Number(body?.cash_price) : null, 
    card_price: body?.card_price ? Number(body?.card_price) : null, 
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
    packs: Array.isArray(body?.packs) ? sanitizePacksForPersistence(body.packs) : undefined,
  };

  const { data, error } = await auth.supabase.from('products').insert(payload).select('*').single();
  if (error) return json(500, { error: error.message });
  return json(201, { product: data });
}

// --- PATCH (Editar) ---
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { validation, responses } = adminProductsApiMessages;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return json(400, { error: validation.missingId });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: validation.invalidJson }); }

  const hasPacksField = hasOwn(body, 'packs');
  if (hasPacksField && !Array.isArray(body.packs)) {
    return json(400, { error: validation.invalidPacksArray });
  }

  if (hasPacksField) {
    const structural = validatePackContracts(body.packs);
    if (!structural.ok) {
      return json(400, {
        error: validation.invalidPackContract,
        details: structural.errors,
      });
    }

    const { data: currentProduct, error: currentErr } = await auth.supabase
      .from('products')
      .select('id, is_active')
      .eq('id', id)
      .single();

    if (currentErr || !currentProduct) {
      return json(404, { error: responses.notFound });
    }

    const finalIsActive = hasOwn(body, 'is_active') ? Boolean(body.is_active) : Boolean(currentProduct.is_active);
    if (finalIsActive && structural.normalized.length > 0) {
      const componentIds = collectComponentProductIds(structural.normalized as any);
      const dbValidation = await validateComponentProductsActive(componentIds, auth.supabase);
      if (!dbValidation.ok) return json(dbValidation.status, dbValidation.body);
    }
  }

  // Sanitizamos packs antes de update (defensa en profundidad: el campo `stock` no se persiste).
  const sanitizedBody = hasPacksField
    ? { ...body, packs: sanitizePacksForPersistence(body.packs) }
    : body;

  const { data, error } = await auth.supabase.from('products').update(sanitizedBody).eq('id', id).select('*').single();

  if (error) return json(500, { error: error.message });
  return json(200, { product: data });
}

// --- DELETE (Borrar) ---
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return json(400, { error: adminProductsApiMessages.validation.missingId });

  const { data, error } = await auth.supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json(500, { error: error.message });
  return json(200, { product: data });
}
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { data, error } = await auth.supabase.from('products').select('*').eq('id', id).single();
  if (error) return json(404, { error: 'Product not found' });

  return json(200, { product: data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const patch: any = {};

  const setIfPresent = (k: string, v: any) => {
    if (v !== undefined) patch[k] = v;
  };

  setIfPresent('name', body.name !== undefined ? String(body.name).trim() : undefined);
  setIfPresent('model', body.model !== undefined ? String(body.model).trim() : undefined);
  setIfPresent('description', body.description !== undefined ? String(body.description).trim() : undefined);
  setIfPresent('image_url', body.image_url !== undefined ? String(body.image_url).trim() : undefined);
  setIfPresent('badge', body.badge !== undefined ? (body.badge ? String(body.badge).trim() : null) : undefined);
  setIfPresent('is_active', body.is_active !== undefined ? Boolean(body.is_active) : undefined);

  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.stock_count !== undefined) patch.stock_count = Number(body.stock_count);

  if (body.original_price !== undefined) {
    patch.original_price =
      body.original_price === null || body.original_price === '' ? null : Number(body.original_price);
  }

  if (body.features !== undefined) {
    patch.features = Array.isArray(body.features) ? body.features : [];
  }

  // Validaciones
  if (patch.price !== undefined && (Number.isNaN(patch.price) || patch.price < 0)) {
    return json(400, { error: 'Invalid price' });
  }
  if (patch.stock_count !== undefined && (Number.isNaN(patch.stock_count) || patch.stock_count < 0)) {
    return json(400, { error: 'Invalid stock_count' });
  }

  // Si viene original_price, validarla contra price final (si no vino price, traemos el actual)
  if (patch.original_price !== undefined) {
    let priceToCompare = patch.price;

    if (priceToCompare === undefined) {
      const { data: current, error: cErr } = await auth.supabase.from('products').select('price').eq('id', id).single();
      if (cErr || !current) return json(404, { error: 'Product not found' });
      priceToCompare = Number(current.price || 0);
    }

    if (
      patch.original_price !== null &&
      (Number.isNaN(patch.original_price) || patch.original_price < priceToCompare)
    ) {
      return json(400, { error: 'original_price must be null or >= price' });
    }
  }

  const { data, error } = await auth.supabase.from('products').update(patch).eq('id', id).select('*').single();
  if (error) return json(500, { error: `DB update error: ${error.message}` });

  return json(200, { product: data });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  // Soft delete: is_active = false
  const { data, error } = await auth.supabase.from('products').update({ is_active: false }).eq('id', id).select('*').single();

  if (error) return json(500, { error: `DB delete error: ${error.message}` });

  return json(200, { product: data });
}

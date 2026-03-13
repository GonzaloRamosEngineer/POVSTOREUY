import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const URUGUAY_DEPARTMENTS = new Set([
  'Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Salto',
  'Paysandú', 'Rivera', 'Tacuarembó', 'Artigas', 'Cerro Largo',
  'Durazno', 'Flores', 'Florida', 'Lavalleja', 'Río Negro',
  'Rocha', 'San José', 'Soriano', 'Treinta y Tres',
]);

const PICKUP_ADDRESS = 'José Enrique Rodó 2219, 11200 Montevideo, Departamento de Montevideo';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseMaybeJson(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function getMethodPrice(paymentMethod: 'mercadopago' | 'bank_transfer', cash: any, card: any, fallback: any) {
  const fallbackPrice = Number(fallback || 0);
  const cashPrice = cash != null && Number(cash) > 0 ? Number(cash) : null;
  const cardPrice = card != null && Number(card) > 0 ? Number(card) : null;
  if (paymentMethod === 'bank_transfer') return cashPrice ?? fallbackPrice;
  return cardPrice ?? fallbackPrice;
}

type NormalizedReqItem =
  | { kind: 'product'; productId: string; quantity: number }
  | { kind: 'pack'; parentProductId: string; packId: string; quantity: number };

function parseLegacyItem(item: any): NormalizedReqItem | null {
  const id = String(item?.id || '');
  const quantity = Number(item?.quantity ?? 0);
  if (!id || !Number.isFinite(quantity) || quantity <= 0) return null;

  if (id.startsWith('pack::')) {
    const [, parentProductId, packId] = id.split('::');
    if (!parentProductId || !packId) return null;
    return { kind: 'pack', parentProductId, packId, quantity };
  }

  const m = id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-(.+)$/i);
  if (m) return { kind: 'pack', parentProductId: m[1], packId: m[2], quantity };

  if (UUID_RE.test(id)) return { kind: 'product', productId: id, quantity };

  return null;
}

function normalizeReqItems(items: any[]): { data: NormalizedReqItem[] | null; error?: string } {
  const normalized: NormalizedReqItem[] = [];

  for (const i of items) {
    const quantity = Number(i?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { data: null, error: 'Each item must include valid quantity' };
    }

    if (i?.type === 'product') {
      const productId = String(i?.product_id || '').trim();
      if (!productId || !UUID_RE.test(productId)) {
        return { data: null, error: 'Invalid product item: product_id is required' };
      }
      normalized.push({ kind: 'product', productId, quantity });
      continue;
    }

    if (i?.type === 'pack') {
      const parentProductId = String(i?.parent_product_id || '').trim();
      const packId = String(i?.pack_id || '').trim();
      if (!parentProductId || !UUID_RE.test(parentProductId) || !packId) {
        return { data: null, error: 'Invalid pack item: parent_product_id and pack_id are required' };
      }
      normalized.push({ kind: 'pack', parentProductId, packId, quantity });
      continue;
    }

    const legacyParsed = parseLegacyItem(i);
    if (!legacyParsed) {
      return { data: null, error: 'Invalid item shape. Use type=product|pack' };
    }
    normalized.push(legacyParsed);
  }

  return { data: normalized };
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { customerInfo, items, paymentMethod, deliveryMethod } = body;

    const dm = deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing customerInfo or items' }, { status: 400 });
    }

    const requiredBaseFields = ['email', 'fullName', 'phone'];
    for (const f of requiredBaseFields) {
      // @ts-ignore
      if (!customerInfo[f]) return NextResponse.json({ error: `Missing customerInfo.${f}` }, { status: 400 });
    }

    if (dm === 'delivery') {
      const requiredDeliveryFields = ['address', 'city', 'department'];
      for (const f of requiredDeliveryFields) {
        // @ts-ignore
        if (!customerInfo[f]) return NextResponse.json({ error: `Missing customerInfo.${f}` }, { status: 400 });
      }
      if (!URUGUAY_DEPARTMENTS.has(customerInfo.department)) {
        return NextResponse.json({ error: `Invalid customerInfo.department: ${customerInfo.department}` }, { status: 400 });
      }
    }

    if (!paymentMethod || !['mercadopago', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid paymentMethod' }, { status: 400 });
    }

    const normalizedReqResult = normalizeReqItems(items);
    if (!normalizedReqResult.data) {
      return NextResponse.json({ error: normalizedReqResult.error || 'Invalid items' }, { status: 400 });
    }
    const normalizedReqItems = normalizedReqResult.data;

    const allProductIds = Array.from(new Set(normalizedReqItems.map((it) =>
      it.kind === 'product' ? it.productId : it.parentProductId
    )));

    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,name,model,price,cash_price,card_price,image_url,stock_count,is_active,packs')
      .in('id', allProductIds);

    if (prodErr) return NextResponse.json({ error: 'Failed to load products', details: prodErr.message }, { status: 500 });

    const byId = new Map<string, any>((products || []).map((p: any) => [p.id, p]));
    const aggregatedByProductId = new Map<string, number>();
    const resolvedLines: Array<{
      product_id: string;
      product_name: string;
      product_model: string;
      product_image_url: string;
      unit_price: number;
      quantity: number;
      total_price: number;
    }> = [];

    for (const reqItem of normalizedReqItems) {
      if (reqItem.kind === 'product') {
        const p = byId.get(reqItem.productId);
        if (!p) return NextResponse.json({ error: `Product not found: ${reqItem.productId}` }, { status: 400 });
        if (!p.is_active) return NextResponse.json({ error: `Product inactive: ${p.name}` }, { status: 400 });

        const unitPrice = getMethodPrice(paymentMethod, p.cash_price, p.card_price, p.price);
        const qty = reqItem.quantity;

        aggregatedByProductId.set(p.id, (aggregatedByProductId.get(p.id) || 0) + qty);
        resolvedLines.push({
          product_id: p.id,
          product_name: p.name,
          product_model: p.model || '',
          product_image_url: p.image_url || '',
          unit_price: unitPrice,
          quantity: qty,
          total_price: unitPrice * qty,
        });
        continue;
      }

      const p = byId.get(reqItem.parentProductId);
      if (!p) return NextResponse.json({ error: `Product not found: ${reqItem.parentProductId}` }, { status: 400 });
      if (!p.is_active) return NextResponse.json({ error: `Product inactive: ${p.name}` }, { status: 400 });

      const packs = parseMaybeJson(p.packs);
      const pack = packs.find((x: any) => String(x?.id || '') === reqItem.packId);
      if (!pack) {
        return NextResponse.json({ error: `Pack not found: ${reqItem.packId} in product ${p.id}` }, { status: 400 });
      }

      const packPrice = getMethodPrice(paymentMethod, pack.cash_price, pack.card_price, pack.price ?? p.price);
      const qty = reqItem.quantity;

      aggregatedByProductId.set(p.id, (aggregatedByProductId.get(p.id) || 0) + qty);
      resolvedLines.push({
        product_id: p.id,
        product_name: `${p.name} - ${pack.name || reqItem.packId}`,
        product_model: p.model || '',
        product_image_url: Array.isArray(pack.images) && pack.images.length > 0 ? String(pack.images[0]) : (p.image_url || ''),
        unit_price: packPrice,
        quantity: qty,
        total_price: packPrice * qty,
      });
    }

    for (const [productId, qty] of aggregatedByProductId.entries()) {
      const p = byId.get(productId);
      if (!p) continue;
      const stock = Number(p.stock_count ?? 0);
      if (qty > stock) {
        return NextResponse.json({ error: `Not enough stock for ${p.name}`, stock }, { status: 400 });
      }
    }

    const merged = new Map<string, any>();
    for (const line of resolvedLines) {
      const key = `${line.product_id}::${line.product_name}::${line.unit_price}`;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, { ...line });
      } else {
        existing.quantity += line.quantity;
        existing.total_price = existing.unit_price * existing.quantity;
      }
    }
    const normalizedItems = Array.from(merged.values());

    const subtotal = normalizedItems.reduce((sum: number, it: any) => sum + it.unit_price * it.quantity, 0);
    const shipping_cost = dm === 'pickup' ? 0 : (subtotal >= 2000 ? 0 : 300);
    const total = subtotal + shipping_cost;

    const orderNumber = `POV-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: orderInserted, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        user_id: null,
        order_number: orderNumber,
        customer_email: customerInfo.email,
        customer_name: customerInfo.fullName,
        customer_phone: customerInfo.phone,
        shipping_address: dm === 'pickup' ? '' : (customerInfo.address || ''),
        shipping_city: dm === 'pickup' ? '' : (customerInfo.city || ''),
        shipping_department: dm === 'pickup' ? 'Montevideo' : (customerInfo.department || 'Montevideo'),
        shipping_postal_code: dm === 'pickup' ? '' : (customerInfo.postalCode || ''),
        subtotal,
        shipping_cost,
        total,
        order_status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        notes: dm === 'pickup' ? `Retiro en local físico: ${PICKUP_ADDRESS}` : null,
      }])
      .select('id, order_number, total, payment_status, order_status')
      .single();

    if (orderErr) return NextResponse.json({ error: 'Failed to create order', details: orderErr.message }, { status: 500 });

    const orderId = orderInserted.id;

    const itemsToInsert = normalizedItems.map((it: any) => ({
      order_id: orderId,
      ...it
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsErr) return NextResponse.json({ error: 'Failed to create order items', details: itemsErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber: orderInserted.order_number,
      total: orderInserted.total,
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Unexpected error', details: e.message }, { status: 500 });
  }
}

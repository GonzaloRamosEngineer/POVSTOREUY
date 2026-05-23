import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit/apply';
import { getCreateOrderLimiters } from '@/lib/rateLimit/limiters';
// IMPORTAMOS EL NUEVO DICCIONARIO
import { apiErrorMessages } from '@/messages/apiErrorMessages';

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
  const { validation } = apiErrorMessages.createOrder;

  for (const i of items) {
    const quantity = Number(i?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { data: null, error: validation.quantity };
    }

    if (i?.type === 'product') {
      const productId = String(i?.product_id || '').trim();
      if (!productId || !UUID_RE.test(productId)) {
        return { data: null, error: validation.missingProductId };
      }
      normalized.push({ kind: 'product', productId, quantity });
      continue;
    }

    if (i?.type === 'pack') {
      const parentProductId = String(i?.parent_product_id || '').trim();
      const packId = String(i?.pack_id || '').trim();
      if (!parentProductId || !UUID_RE.test(parentProductId) || !packId) {
        return { data: null, error: validation.missingPackIds };
      }
      normalized.push({ kind: 'pack', parentProductId, packId, quantity });
      continue;
    }

    const legacyParsed = parseLegacyItem(i);
    if (!legacyParsed) {
      return { data: null, error: validation.invalidShape };
    }
    normalized.push(legacyParsed);
  }

  return { data: normalized };
}

type PackComponent = {
  product_id: string;
  quantity: number;
  role: 'primary' | 'component';
};

type ValidatedPack = {
  id: string;
  name: string;
  price: number;
  cash_price: number | null;
  card_price: number | null;
  version: number;
  image_url: string;
  components: PackComponent[];
};

function normalizeCustomerForIdempotency(customerInfo: any, deliveryMethod: 'pickup' | 'delivery') {
  return {
    email: String(customerInfo?.email || '').trim().toLowerCase(),
    fullName: String(customerInfo?.fullName || '').trim(),
    phone: String(customerInfo?.phone || '').trim(),
    address: deliveryMethod === 'pickup' ? '' : String(customerInfo?.address || '').trim(),
    city: deliveryMethod === 'pickup' ? '' : String(customerInfo?.city || '').trim(),
    department: deliveryMethod === 'pickup' ? '' : String(customerInfo?.department || '').trim(),
    postalCode: deliveryMethod === 'pickup' ? '' : String(customerInfo?.postalCode || '').trim(),
  };
}

function getIdempotencyPayloadHash(payload: any): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function validatePackOrNull(packRaw: any): { ok: true; pack: ValidatedPack } | { ok: false; error: string } {
  const { validation } = apiErrorMessages.createOrder;
  
  if (!packRaw || typeof packRaw !== 'object') return { ok: false, error: validation.packInvalid };

  const componentsRaw = Array.isArray(packRaw.components) ? packRaw.components : null;
  if (!componentsRaw || componentsRaw.length === 0) {
    return { ok: false, error: validation.packNoComponents };
  }

  const components: PackComponent[] = [];
  let primaryCount = 0;

  for (const c of componentsRaw) {
    const product_id = String(c?.product_id || '').trim();
    const role = c?.role === 'primary' ? 'primary' : c?.role === 'component' ? 'component' : null;
    const quantity = Number(c?.quantity ?? 0);

    if (!product_id || !UUID_RE.test(product_id)) {
      return { ok: false, error: validation.packInvalidProductId };
    }
    if (!role) {
      return { ok: false, error: validation.packInvalidRole };
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: validation.packInvalidQuantity };
    }

    if (role === 'primary') primaryCount += 1;
    components.push({ product_id, role, quantity: Math.trunc(quantity) });
  }

  if (primaryCount !== 1) {
    return { ok: false, error: validation.packMultiplePrimary };
  }

  const versionRaw = Number(packRaw.version ?? 1);
  const version = Number.isFinite(versionRaw) && versionRaw >= 1 ? Math.trunc(versionRaw) : 1;

  return {
    ok: true,
    pack: {
      id: String(packRaw.id || ''),
      name: String(packRaw.name || '').trim(),
      price: Number(packRaw.price ?? 0),
      cash_price: packRaw.cash_price != null ? Number(packRaw.cash_price) : null,
      card_price: packRaw.card_price != null ? Number(packRaw.card_price) : null,
      version,
      image_url: Array.isArray(packRaw.images) && packRaw.images.length > 0 ? String(packRaw.images[0]) : '',
      components,
    },
  };
}

export async function POST(request: Request) {
  const msgs = apiErrorMessages.createOrder;

  try {
    const { perMinute, perHour } = getCreateOrderLimiters();
    const { blockedResponse } = await applyRateLimit(getClientIp(request), [perMinute, perHour]);
    if (blockedResponse) return blockedResponse;

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { customerInfo, items, paymentMethod, deliveryMethod, idempotency_key, expectedTotal, strictPricing } = body;

    const idempotencyKey = String(idempotency_key || '').trim();
    if (!idempotencyKey || idempotencyKey.length > 128) {
      return NextResponse.json({ error: msgs.missingIdempotency }, { status: 400 });
    }

    const dm = deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: msgs.missingCustomerOrItems }, { status: 400 });
    }

    const requiredBaseFields = ['email', 'fullName', 'phone'];
    for (const f of requiredBaseFields) {
      // @ts-ignore
      if (!customerInfo[f]) return NextResponse.json({ error: msgs.missingField(f) }, { status: 400 });
    }

    if (dm === 'delivery') {
      const requiredDeliveryFields = ['address', 'city', 'department'];
      for (const f of requiredDeliveryFields) {
        // @ts-ignore
        if (!customerInfo[f]) return NextResponse.json({ error: msgs.missingField(f) }, { status: 400 });
      }
      if (!URUGUAY_DEPARTMENTS.has(customerInfo.department)) {
        return NextResponse.json({ error: msgs.invalidDepartment(customerInfo.department) }, { status: 400 });
      }
    }

    if (!paymentMethod || !['mercadopago', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: msgs.invalidPaymentMethod }, { status: 400 });
    }

    const normalizedReqResult = normalizeReqItems(items);
    if (!normalizedReqResult.data) {
      return NextResponse.json({ error: normalizedReqResult.error || msgs.validation.invalidShape }, { status: 400 });
    }
    const normalizedReqItems = normalizedReqResult.data;

    const idempotencyPayload = {
      items: [...normalizedReqItems]
        .map((x) => x)
        .sort((a, b) => {
          const ka = a.kind === 'product' ? `product:${a.productId}:${a.quantity}` : `pack:${a.parentProductId}:${a.packId}:${a.quantity}`;
          const kb = b.kind === 'product' ? `product:${b.productId}:${b.quantity}` : `pack:${b.parentProductId}:${b.packId}:${b.quantity}`;
          return ka.localeCompare(kb);
        }),
      paymentMethod,
      deliveryMethod: dm,
      customerInfo: normalizeCustomerForIdempotency(customerInfo, dm),
    };
    const idempotencyPayloadHash = getIdempotencyPayloadHash(idempotencyPayload);

    const { data: existingByIdempotency, error: existingByIdempotencyErr } = await supabase
      .from('orders')
      .select('id, order_number, total, idempotency_payload_hash')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingByIdempotencyErr) {
      return NextResponse.json({ error: msgs.idempotencyCheckFailed, details: existingByIdempotencyErr.message }, { status: 500 });
    }

    if (existingByIdempotency) {
      if (String(existingByIdempotency.idempotency_payload_hash || '') !== idempotencyPayloadHash) {
        return NextResponse.json({ error: msgs.idempotencyConflict }, { status: 409 });
      }
      return NextResponse.json({
        ok: true,
        orderId: existingByIdempotency.id,
        orderNumber: existingByIdempotency.order_number,
        total: existingByIdempotency.total,
      });
    }

    const baseProductIds = Array.from(new Set(normalizedReqItems.map((it) =>
      it.kind === 'product' ? it.productId : it.parentProductId
    )));

    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,name,model,price,cash_price,card_price,image_url,stock_count,is_active,packs')
      .in('id', baseProductIds);

    if (prodErr) return NextResponse.json({ error: msgs.productsLoadFailed, details: prodErr.message }, { status: 500 });

    const byId = new Map<string, any>((products || []).map((p: any) => [p.id, p]));
    const neededComponentIds = new Set<string>();

    for (const reqItem of normalizedReqItems) {
      if (reqItem.kind !== 'pack') continue;

      const parent = byId.get(reqItem.parentProductId);
      if (!parent) return NextResponse.json({ error: msgs.productNotFound }, { status: 400 });
      if (!parent.is_active) return NextResponse.json({ error: msgs.productInactive(parent.name) }, { status: 400 });

      const packs = parseMaybeJson(parent.packs);
      const packRaw = packs.find((x: any) => String(x?.id || '') === reqItem.packId);
      if (!packRaw) {
        return NextResponse.json({ error: msgs.packNotFound }, { status: 400 });
      }

      const validatedPack = validatePackOrNull(packRaw);
      if (validatedPack.ok === false) {
        return NextResponse.json({ error: msgs.invalidPack, details: validatedPack.error }, { status: 400 });
      }

      for (const c of validatedPack.pack.components) {
        neededComponentIds.add(c.product_id);
      }
    }

    const missingComponentIds = Array.from(neededComponentIds).filter((id) => !byId.has(id));
    if (missingComponentIds.length > 0) {
      const { data: componentProducts, error: compErr } = await supabase
        .from('products')
        .select('id,name,model,price,cash_price,card_price,image_url,stock_count,is_active')
        .in('id', missingComponentIds);

      if (compErr) {
        return NextResponse.json({ error: msgs.packComponentsLoadFailed, details: compErr.message }, { status: 500 });
      }

      for (const p of (componentProducts || [])) byId.set(p.id, p);
    }

    const stockNeededByProductId = new Map<string, number>();
    const simpleLines: any[] = [];
    const packLines: any[] = [];

    for (const reqItem of normalizedReqItems) {
      if (reqItem.kind === 'product') {
        const p = byId.get(reqItem.productId);
        if (!p) return NextResponse.json({ error: msgs.productNotFound }, { status: 400 });
        if (!p.is_active) return NextResponse.json({ error: msgs.productInactive(p.name) }, { status: 400 });

        const unitPrice = getMethodPrice(paymentMethod, p.cash_price, p.card_price, p.price);
        const qty = reqItem.quantity;

        stockNeededByProductId.set(p.id, (stockNeededByProductId.get(p.id) || 0) + qty);

        simpleLines.push({
          line_type: 'simple',
          pack_group_id: null,
          pack_id: null,
          pack_parent_product_id: null,
          pack_version: null,
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

      const parent = byId.get(reqItem.parentProductId);
      if (!parent) return NextResponse.json({ error: msgs.productNotFound }, { status: 400 });
      if (!parent.is_active) return NextResponse.json({ error: msgs.productInactive(parent.name) }, { status: 400 });

      const packs = parseMaybeJson(parent.packs);
      const packRaw = packs.find((x: any) => String(x?.id || '') === reqItem.packId);
      if (!packRaw) {
        return NextResponse.json({ error: msgs.packNotFound }, { status: 400 });
      }

      const validatedPack = validatePackOrNull(packRaw);
      if (validatedPack.ok === false) {
        return NextResponse.json({ error: msgs.invalidPack, details: validatedPack.error }, { status: 400 });
      }

      const pack = validatedPack.pack;
      const packUnitPrice = getMethodPrice(paymentMethod, pack.cash_price, pack.card_price, pack.price ?? parent.price);
      const packRequestedQty = reqItem.quantity;
      const packGroupId = randomUUID();
      const primaryComponent = pack.components.find((c) => c.role === 'primary');

      if (!primaryComponent) {
        return NextResponse.json({ error: msgs.invalidPack }, { status: 400 });
      }

      const primaryProduct = byId.get(primaryComponent.product_id);
      if (!primaryProduct) {
        return NextResponse.json({ error: msgs.packComponentNotFound }, { status: 400 });
      }
      if (!primaryProduct.is_active) {
        return NextResponse.json({ error: msgs.packComponentInactive(primaryProduct.name) }, { status: 400 });
      }

      packLines.push({
        line_type: 'pack_primary',
        pack_group_id: packGroupId,
        pack_id: pack.id,
        pack_parent_product_id: parent.id,
        pack_version: pack.version,
        product_id: primaryComponent.product_id,
        product_name: `${parent.name} - ${pack.name || reqItem.packId}`,
        product_model: primaryProduct.model || parent.model || '',
        product_image_url: pack.image_url || primaryProduct.image_url || parent.image_url || '',
        unit_price: packUnitPrice,
        quantity: packRequestedQty,
        total_price: packUnitPrice * packRequestedQty,
      });

      for (const c of pack.components) {
        const componentProduct = byId.get(c.product_id);
        if (!componentProduct) {
          return NextResponse.json({ error: msgs.packComponentNotFound }, { status: 400 });
        }
        if (!componentProduct.is_active) {
          return NextResponse.json({ error: msgs.packComponentInactive(componentProduct.name) }, { status: 400 });
        }

        const componentQty = packRequestedQty * c.quantity;
        stockNeededByProductId.set(c.product_id, (stockNeededByProductId.get(c.product_id) || 0) + componentQty);

        packLines.push({
          line_type: 'pack_component',
          pack_group_id: packGroupId,
          pack_id: pack.id,
          pack_parent_product_id: parent.id,
          pack_version: pack.version,
          product_id: c.product_id,
          product_name: componentProduct.name,
          product_model: componentProduct.model || '',
          product_image_url: componentProduct.image_url || '',
          unit_price: 0,
          quantity: componentQty,
          total_price: 0,
        });
      }
    }

    for (const [productId, qty] of stockNeededByProductId.entries()) {
      const p = byId.get(productId);
      if (!p) continue;
      const stock = Number(p.stock_count ?? 0);
      if (qty > stock) {
        return NextResponse.json({ error: msgs.notEnoughStock(p.name), stock }, { status: 400 });
      }
    }

    const mergedSimple = new Map<string, any>();
    for (const line of simpleLines) {
      const key = `${line.product_id}::${line.unit_price}`;
      const existing = mergedSimple.get(key);
      if (!existing) {
        mergedSimple.set(key, { ...line });
      } else {
        existing.quantity += line.quantity;
        existing.total_price = existing.unit_price * existing.quantity;
      }
    }

    const normalizedItems = [...Array.from(mergedSimple.values()), ...packLines];

    const subtotal = normalizedItems
      .filter((it: any) => it.line_type === 'simple' || it.line_type === 'pack_primary')
      .reduce((sum: number, it: any) => sum + it.unit_price * it.quantity, 0);
    const shipping_cost = dm === 'pickup' ? 0 : (subtotal >= 2000 ? 0 : 300);
    const total = subtotal + shipping_cost;

    // PF-06: price drift detection (hibrid).
    // Si el cliente envía expectedTotal y difiere del computado (>0.01 tolerancia float):
    //   - strictPricing=true → 409 + breakdown, NO se crea la orden (modo enterprise / front nuevo).
    //   - strictPricing=false (default) → continúa, se crea la orden, se incluye breakdown informativo (modo backwards-compat).
    const expectedTotalNum = expectedTotal != null && Number.isFinite(Number(expectedTotal)) ? Number(expectedTotal) : null;
    const priceDrift = expectedTotalNum != null && Math.abs(expectedTotalNum - total) > 0.01
      ? { expected: expectedTotalNum, computed: total, diff: Number((total - expectedTotalNum).toFixed(2)) }
      : null;

    if (priceDrift && strictPricing === true) {
      return NextResponse.json(
        { error: msgs.priceDriftRejected, priceDrift },
        { status: 409 }
      );
    }

    const orderNumber = `POV-${Math.floor(100000 + Math.random() * 900000)}`;

    // PF-05: orders + order_items en una sola transacción atómica vía RPC.
    // Si falla cualquiera de los dos inserts, la transacción de la función revierte ambos.
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_order_transactional', {
      p_order_number:             orderNumber,
      p_customer_email:           customerInfo.email,
      p_customer_name:            customerInfo.fullName,
      p_customer_phone:           customerInfo.phone,
      p_shipping_address:         dm === 'pickup' ? '' : (customerInfo.address || ''),
      p_shipping_city:            dm === 'pickup' ? '' : (customerInfo.city || ''),
      p_shipping_department:      dm === 'pickup' ? 'Montevideo' : (customerInfo.department || 'Montevideo'),
      p_shipping_postal_code:     dm === 'pickup' ? '' : (customerInfo.postalCode || ''),
      p_subtotal:                 subtotal,
      p_shipping_cost:            shipping_cost,
      p_total:                    total,
      p_payment_method:           paymentMethod,
      p_notes:                    dm === 'pickup' ? `Retiro en local físico: ${PICKUP_ADDRESS}` : null,
      p_idempotency_key:          idempotencyKey,
      p_idempotency_payload_hash: idempotencyPayloadHash,
      p_items:                    normalizedItems,
    });

    if (rpcErr) {
      return NextResponse.json(
        { error: msgs.orderCreationFailed, details: rpcErr.message },
        { status: 500 }
      );
    }

    const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    if (!row) {
      return NextResponse.json({ error: msgs.orderCreationFailed }, { status: 500 });
    }

    if (row.status === 'payload_mismatch') {
      return NextResponse.json({ error: msgs.idempotencyConflict }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      orderId: row.order_id,
      orderNumber: row.order_number,
      total: row.total,
      ...(priceDrift ? { priceDrift } : {}),
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: msgs.unexpected, details: e.message }, { status: 500 });
  }
}
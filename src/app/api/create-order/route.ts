import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const URUGUAY_DEPARTMENTS = new Set([
  'Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Salto',
  'Paysandú', 'Rivera', 'Tacuarembó', 'Artigas', 'Cerro Largo',
  'Durazno', 'Flores', 'Florida', 'Lavalleja', 'Río Negro',
  'Rocha', 'San José', 'Soriano', 'Treinta y Tres',
]);

const PICKUP_ADDRESS = 'José Enrique Rodó 2219, 11200 Montevideo, Departamento de Montevideo';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { customerInfo, items, paymentMethod, deliveryMethod } = body;

    const dm = deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

    // 1. Validaciones
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

    // Normalizar items
    const normalizedReqItems = items.map((i: any) => ({
      id: i?.id,
      quantity: Number(i?.quantity ?? 0),
    }));

    if (normalizedReqItems.some((i: any) => !i.id)) {
      return NextResponse.json({ error: 'Each item must include id' }, { status: 400 });
    }
    if (normalizedReqItems.some((i: any) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
      return NextResponse.json({ error: 'Each item must include valid quantity' }, { status: 400 });
    }

    // Dedup
    const qtyById = new Map();
    for (const it of normalizedReqItems) {
      qtyById.set(it.id, (qtyById.get(it.id) || 0) + it.quantity);
    }
    const productIds = Array.from(qtyById.keys());

    // 2. Cargar Productos y Validar Stock
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,name,model,price,image_url,stock_count,is_active')
      .in('id', productIds);

    if (prodErr) return NextResponse.json({ error: 'Failed to load products', details: prodErr.message }, { status: 500 });

    const byId = new Map((products || []).map((p: any) => [p.id, p]));

    for (const productId of productIds) {
      const p = byId.get(productId);
      const qty = Number(qtyById.get(productId) || 0);

      if (!p) return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 400 });
      if (!p.is_active) return NextResponse.json({ error: `Product inactive: ${p.name}` }, { status: 400 });

      const stock = Number(p.stock_count ?? 0);
      if (qty > stock) return NextResponse.json({ error: `Not enough stock for ${p.name}`, stock }, { status: 400 });
    }

    // 3. Preparar insert
    const normalizedItems = productIds.map((pid) => {
      const p = byId.get(pid);
      const qty = Number(qtyById.get(pid));
      return {
        product_id: p.id,
        product_name: p.name,
        product_model: p.model || '',
        product_image_url: p.image_url || '',
        unit_price: Number(p.price),
        quantity: qty,
        total_price: Number(p.price) * qty,
      };
    });

    const subtotal = normalizedItems.reduce((sum: number, it: any) => sum + it.unit_price * it.quantity, 0);
    const shipping_cost = dm === 'pickup' ? 0 : (subtotal >= 2000 ? 0 : 250);
    const total = subtotal + shipping_cost;
    
    // Generar Número de orden
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

    // 4. Insertar Items
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
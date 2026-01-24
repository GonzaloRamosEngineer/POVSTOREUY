// C:\Projects\POVStoreUruguay\api\create-order.js
const { getSupabaseAdmin } = require('./_supabaseAdmin');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function safeJsonParse(input) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

const URUGUAY_DEPARTMENTS = new Set([
  'Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Salto',
  'Paysandú', 'Rivera', 'Tacuarembó', 'Artigas', 'Cerro Largo',
  'Durazno', 'Flores', 'Florida', 'Lavalleja', 'Río Negro',
  'Rocha', 'San José', 'Soriano', 'Treinta y Tres',
]);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    const supabase = getSupabaseAdmin();
    const body = safeJsonParse(req.body) || {};

    const { customerInfo, items, paymentMethod } = body;

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return json(res, 400, { error: 'Missing customerInfo or items' });
    }

    const requiredCustomerFields = ['email', 'fullName', 'phone', 'address', 'city', 'department', 'postalCode'];
    for (const f of requiredCustomerFields) {
      if (!customerInfo[f]) return json(res, 400, { error: `Missing customerInfo.${f}` });
    }

    if (!URUGUAY_DEPARTMENTS.has(customerInfo.department)) {
      return json(res, 400, { error: `Invalid customerInfo.department: ${customerInfo.department}` });
    }

    if (!paymentMethod || !['mercadopago', 'bank_transfer'].includes(paymentMethod)) {
      return json(res, 400, { error: 'Invalid paymentMethod' });
    }

    // Normalizar items: [{id, quantity}]
    const normalizedReqItems = items.map((i) => ({
      id: i?.id,
      quantity: Number(i?.quantity ?? 0),
    }));

    if (normalizedReqItems.some((i) => !i.id)) {
      return json(res, 400, { error: 'Each item must include id (product uuid)' });
    }
    if (normalizedReqItems.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
      return json(res, 400, { error: 'Each item must include valid quantity > 0' });
    }

    // Dedup por id
    const qtyById = new Map();
    for (const it of normalizedReqItems) {
      qtyById.set(it.id, (qtyById.get(it.id) || 0) + it.quantity);
    }
    const productIds = Array.from(qtyById.keys());

    // 1) Traer productos (precios SOLO DB)
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,name,model,price,image_url,stock_count,is_active')
      .in('id', productIds);

    if (prodErr) return json(res, 500, { error: 'Failed to load products', details: prodErr.message });

    const byId = new Map((products || []).map((p) => [p.id, p]));

    // Validaciones DB: activos + stock
    for (const productId of productIds) {
      const p = byId.get(productId);
      const qty = Number(qtyById.get(productId) || 0);

      if (!p) return json(res, 400, { error: `Product not found: ${productId}` });
      if (!p.is_active) return json(res, 400, { error: `Product inactive: ${p.name}` });

      const stock = Number(p.stock_count ?? 0);
      if (qty > stock) return json(res, 400, { error: `Not enough stock for ${p.name}`, stock });
    }

    // 2) Normalizar items para order_items
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

    const subtotal = normalizedItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
    const shipping_cost = subtotal >= 2000 ? 0 : 250; // tu regla actual
    const total = subtotal + shipping_cost;

    // 3) Insert order (schema REAL)
    const { data: orderInserted, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        user_id: null, // checkout sin login
        customer_email: customerInfo.email,
        customer_name: customerInfo.fullName,
        customer_phone: customerInfo.phone,

        shipping_address: customerInfo.address,
        shipping_city: customerInfo.city,
        shipping_department: customerInfo.department,
        shipping_postal_code: customerInfo.postalCode,

        subtotal,
        shipping_cost,
        total,

        order_status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        payment_id: null,
        notes: null,
      }])
      .select('id, order_number, total, payment_status, order_status')
      .single();

    if (orderErr) return json(res, 500, { error: 'Failed to create order', details: orderErr.message });

    const orderId = orderInserted.id;

    // 4) Insert order_items (schema REAL)
    const itemsToInsert = normalizedItems.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      product_name: it.product_name,
      product_model: it.product_model,
      product_image_url: it.product_image_url,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsErr) return json(res, 500, { error: 'Failed to create order items', details: itemsErr.message });

    return json(res, 200, {
      ok: true,
      orderId,
      orderNumber: orderInserted.order_number,
      total: orderInserted.total,
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Unexpected error', details: e.message });
  }
};

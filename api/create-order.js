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

function buildReference() {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `POV${year}${rand}`;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    const supabase = getSupabaseAdmin();
    const body = safeJsonParse(req.body) || {};

    const { customerInfo, items, paymentMethod } = body;

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return json(res, 400, { error: 'Missing customerInfo or items' });
    }

    const requiredCustomerFields = ['email', 'fullName', 'phone', 'address', 'city', 'department'];
    for (const f of requiredCustomerFields) {
      if (!customerInfo[f]) return json(res, 400, { error: `Missing customerInfo.${f}` });
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

    // Dedup por id (si el carrito mete repetidos por bug)
    const qtyById = new Map();
    for (const it of normalizedReqItems) {
      qtyById.set(it.id, (qtyById.get(it.id) || 0) + it.quantity);
    }
    const productIds = Array.from(qtyById.keys());

    // 1) Traer productos
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,name,model,price,image_url,stock_count,is_active')
      .in('id', productIds);

    if (prodErr) return json(res, 500, { error: 'Failed to load products', details: prodErr.message });

    const byId = new Map((products || []).map((p) => [p.id, p]));

    // Validaciones DB (activos + stock)
    for (const productId of productIds) {
      const p = byId.get(productId);
      const qty = Number(qtyById.get(productId) || 0);

      if (!p) return json(res, 400, { error: `Product not found: ${productId}` });
      if (!p.is_active) return json(res, 400, { error: `Product inactive: ${p.name}` });

      const stock = Number(p.stock_count ?? 0);
      if (qty > stock) return json(res, 400, { error: `Not enough stock for ${p.name}`, stock });
    }

    // 2) Totales (precios solo DB)
    const normalizedItems = productIds.map((pid) => {
      const p = byId.get(pid);
      const qty = Number(qtyById.get(pid));
      return {
        product_id: p.id,
        name: p.name,
        model: p.model || '',
        unit_price: Number(p.price),
        quantity: qty,
        image_url: p.image_url || '',
      };
    });

    const subtotal = normalizedItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
    const shipping = subtotal >= 2000 ? 0 : 250; // consistente con tu UI
    const total = subtotal + shipping;

    const referenceNumber = buildReference();

    // 3) Insert order
    const { data: orderInserted, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          customer_email: customerInfo.email,
          customer_name: customerInfo.fullName,
          customer_phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          department: customerInfo.department,
          postal_code: customerInfo.postalCode || null,

          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'created',

          subtotal,
          shipping,
          total,

          reference_number: referenceNumber,
        },
      ])
      .select('id, reference_number, total, payment_status, status')
      .single();

    if (orderErr) return json(res, 500, { error: 'Failed to create order', details: orderErr.message });

    const orderId = orderInserted.id;

    // 4) Insert items
    const itemsToInsert = normalizedItems.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      name: it.name,
      model: it.model,
      unit_price: it.unit_price,
      quantity: it.quantity,
      image_url: it.image_url,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsErr) return json(res, 500, { error: 'Failed to create order items', details: itemsErr.message });

    return json(res, 200, {
      ok: true,
      orderId,
      referenceNumber: orderInserted.reference_number,
      total: orderInserted.total,
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Unexpected error', details: e.message });
  }
};

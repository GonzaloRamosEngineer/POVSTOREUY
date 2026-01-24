// C:\Projects\POVStoreUruguay\api\mp-preference.js
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

async function mpCreatePreference(accessToken, preference, idempotencyKey) {
  const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(preference),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`MP preference error: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    const accessToken = process.env.MP_ACCESS_TOKEN; // tu estándar ✅
    const siteUrl = process.env.SITE_URL;

    if (!accessToken) return json(res, 500, { error: 'Missing MP_ACCESS_TOKEN env var' });
    if (!siteUrl) return json(res, 500, { error: 'Missing SITE_URL env var' });

    const supabase = getSupabaseAdmin();
    const body = safeJsonParse(req.body) || {};
    const { orderId } = body || {};
    if (!orderId) return json(res, 400, { error: 'Missing orderId' });

    // Traer order
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, customer_name, payment_status, total, shipping_cost, subtotal, notes')
      .eq('id', orderId)
      .single();

    if (oErr || !order) return json(res, 404, { error: 'Order not found' });

    // Si ya está pago, no crear preferencia de nuevo
    if (order.payment_status === 'completed') {
      return json(res, 400, { error: 'Order already completed' });
    }

    const { data: orderItems, error: iErr } = await supabase
      .from('order_items')
      .select('product_name, product_model, quantity, unit_price')
      .eq('order_id', orderId);

    if (iErr) return json(res, 500, { error: 'Failed to load order items', details: iErr.message });
    if (!orderItems || orderItems.length === 0) return json(res, 400, { error: 'Order has no items' });

    const mpItems = orderItems.map((it) => ({
      title: `${it.product_name}${it.product_model ? ` - ${it.product_model}` : ''}`,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      currency_id: 'UYU',
    }));

    const preference = {
      items: mpItems,
      payer: {
        email: order.customer_email,
        name: order.customer_name,
      },
      external_reference: orderId,
      notification_url: `${siteUrl}/api/mp-webhook`,
      back_urls: {
        success: `${siteUrl}/order-confirmation?orderId=${orderId}&status=success`,
        pending: `${siteUrl}/order-confirmation?orderId=${orderId}&status=pending`,
        failure: `${siteUrl}/order-confirmation?orderId=${orderId}&status=failure`,
      },
      auto_return: 'approved',
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
      // binary_mode: true,
    };

    const mpPref = await mpCreatePreference(accessToken, preference, `pref-${orderId}`);

    // ✅ Como tu schema no tiene columnas mp_*: guardamos en notes (JSON)
    // Si más adelante agregás columnas, lo migramos.
    const previousNotes = (() => {
      try { return order.notes ? JSON.parse(order.notes) : {}; } catch { return {}; }
    })();

    const nextNotes = {
      ...previousNotes,
      mp: {
        preference_id: mpPref.id,
        init_point: mpPref.init_point || null,
        sandbox_init_point: mpPref.sandbox_init_point || null,
        created_at: new Date().toISOString(),
      },
    };

    await supabase
      .from('orders')
      .update({ notes: JSON.stringify(nextNotes) })
      .eq('id', orderId);

    return json(res, 200, {
      ok: true,
      orderId,
      preferenceId: mpPref.id,
      initPoint: mpPref.init_point,
      sandboxInitPoint: mpPref.sandbox_init_point,
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Unexpected error', details: e.message });
  }
};

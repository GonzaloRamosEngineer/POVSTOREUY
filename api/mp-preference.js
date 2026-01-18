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

async function mpCreatePreference(accessToken, preference) {
  const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
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

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const siteUrl = process.env.SITE_URL;

    if (!accessToken) return json(res, 500, { error: 'Missing MP_ACCESS_TOKEN env var' });
    if (!siteUrl) return json(res, 500, { error: 'Missing SITE_URL env var' });

    const supabase = getSupabaseAdmin();
    const body = safeJsonParse(req.body) || {};
    const { orderId } = body || {};
    if (!orderId) return json(res, 400, { error: 'Missing orderId' });

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (oErr || !order) return json(res, 404, { error: 'Order not found' });

    const { data: orderItems, error: iErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (iErr) return json(res, 500, { error: 'Failed to load order items', details: iErr.message });
    if (!orderItems || orderItems.length === 0) return json(res, 400, { error: 'Order has no items' });

    const mpItems = orderItems.map((it) => ({
      title: `${it.name}${it.model ? ` - ${it.model}` : ''}`,
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
        reference_number: order.reference_number,
      },

      // Opcional recomendado:
      // binary_mode: true, // si querés “approved/rejected” y menos estados intermedios
    };

    const mpPref = await mpCreatePreference(accessToken, preference);

    await supabase
      .from('orders')
      .update({
        mp_preference_id: mpPref.id,
        mp_init_point: mpPref.init_point || null,
        mp_sandbox_init_point: mpPref.sandbox_init_point || null,
      })
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

// C:\Projects\POVStoreUruguay\api\order-details.js
const { getSupabaseAdmin } = require('./_supabaseAdmin');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

    const orderId = req.query?.orderId;
    if (!orderId) return json(res, 400, { error: 'Missing orderId' });

    const supabase = getSupabaseAdmin();

    // 1) order
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        subtotal,
        shipping_cost,
        total,
        order_status,
        payment_method,
        payment_status,
        payment_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_department,
        shipping_postal_code,
        notes,
        mp_status,
        mp_status_detail
      `)
      .eq('id', orderId)
      .single();

    if (oErr || !order) return json(res, 404, { error: 'Order not found' });

    // 2) items
    const { data: items, error: iErr } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        product_name,
        product_model,
        product_image_url,
        quantity,
        unit_price,
        total_price
      `)
      .eq('order_id', orderId)
      .order('id', { ascending: true });

    if (iErr) return json(res, 500, { error: 'Failed to load order items', details: iErr.message });

    return json(res, 200, { ok: true, order, items: items || [] });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Unexpected error', details: e.message });
  }
};

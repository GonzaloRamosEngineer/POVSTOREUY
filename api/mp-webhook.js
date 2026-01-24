// C:\Projects\POVStoreUruguay\api\mp-webhook.js
const { getSupabaseAdmin } = require('./_supabaseAdmin');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function mpGetPayment(accessToken, paymentId) {
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`MP payment error: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

function mapMpToDbStatuses(mpStatus) {
  // DB enums:
  // payment_status: pending | completed | failed | refunded
  // order_status:   pending | processing | completed | cancelled
  let payment_status = 'pending';
  let order_status = 'pending';

  if (mpStatus === 'approved') {
    payment_status = 'completed';
    order_status = 'processing'; // o 'completed' si vos entregás “instantáneo”
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    payment_status = 'failed';
    order_status = 'cancelled';
  } else if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
    payment_status = 'refunded';
    order_status = 'cancelled';
  } else {
    // pending | in_process | authorized | etc.
    payment_status = 'pending';
    order_status = 'pending';
  }

  return { payment_status, order_status };
}

module.exports = async (req, res) => {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return json(res, 500, { error: 'Missing MP_ACCESS_TOKEN env var' });

    const supabase = getSupabaseAdmin();

    // MP webhook can come as:
    // ?type=payment&data.id=123  OR  ?topic=payment&id=123
    const q = req.query || {};
    const paymentId = q['data.id'] || q.id || q['data[id]'];

    // Always return 200 quickly to avoid retries storms
    if (!paymentId) {
      console.warn('MP webhook called without paymentId:', q);
      return json(res, 200, { ok: true, received: true });
    }

    // 1) Verify payment status using MP API (source of truth)
    const payment = await mpGetPayment(accessToken, paymentId);

    const orderId =
      payment.external_reference ||
      payment.metadata?.order_id ||
      payment.metadata?.orderId;

    if (!orderId) {
      console.warn('Payment without orderId reference:', paymentId);
      return json(res, 200, { ok: true, received: true });
    }

    const mpStatus = payment.status; // approved | rejected | pending | in_process | ...
    const statusDetail = payment.status_detail || null;

    const { payment_status, order_status } = mapMpToDbStatuses(mpStatus);

    // 2) Load existing order (idempotency & sanity)
    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id, payment_status, order_status')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      console.warn('Order not found for webhook orderId:', orderId);
      return json(res, 200, { ok: true, received: true });
    }

    const alreadyCompleted = existingOrder.payment_status === 'completed';

    // 3) Update order statuses + MP fields (aligned to your DB)
    const { error: upErr } = await supabase
      .from('orders')
      .update({
        payment_status,
        order_status,
        payment_id: String(paymentId),
        mp_status: mpStatus,
        mp_status_detail: statusDetail,
      })
      .eq('id', orderId);

    if (upErr) {
      console.error('Failed updating order from webhook:', upErr);
      return json(res, 200, { ok: true, received: true });
    }

    // 4) If already completed, do NOT discount stock again
    if (alreadyCompleted) {
      return json(res, 200, { ok: true });
    }

    // 5) On approved -> discount stock (once)
    if (payment_status === 'completed') {
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (iErr) {
        console.error('Failed loading order_items for stock discount:', iErr);
        return json(res, 200, { ok: true, received: true });
      }

      if (items?.length) {
        for (const it of items) {
          const productId = it.product_id;
          const qty = Number(it.quantity || 0);
          if (!productId || !qty) continue;

          const { data: p, error: pErr } = await supabase
            .from('products')
            .select('id, stock_count')
            .eq('id', productId)
            .single();

          if (pErr || !p) continue;

          const current = Number(p.stock_count ?? 0);
          const next = Math.max(0, current - qty);

          await supabase.from('products').update({ stock_count: next }).eq('id', productId);
        }
      }

      // Optional: if you want to mark as completed after stock discount:
      // await supabase.from('orders').update({ order_status: 'completed' }).eq('id', orderId);
    }

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    // Always return 200 to prevent infinite retries
    return json(res, 200, { ok: true, received: true });
  }
};

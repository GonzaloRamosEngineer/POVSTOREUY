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

module.exports = async (req, res) => {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return json(res, 500, { error: 'Missing MP_ACCESS_TOKEN env var' });

    const supabase = getSupabaseAdmin();

    // MP: ?type=payment&data.id=123  OR  ?topic=payment&id=123
    const q = req.query || {};
    const paymentId = q['data.id'] || q.id || q['data[id]'];

    if (!paymentId) {
      console.warn('MP webhook called without paymentId:', q);
      return json(res, 200, { ok: true, received: true });
    }

    const payment = await mpGetPayment(accessToken, paymentId);

    const orderId =
      payment.external_reference ||
      payment.metadata?.order_id ||
      payment.metadata?.orderId;

    if (!orderId) {
      console.warn('Payment without orderId reference:', paymentId);
      return json(res, 200, { ok: true, received: true });
    }

    const mpStatus = payment.status; // approved | rejected | pending | in_process ...
    const statusDetail = payment.status_detail || null;

    let paymentStatus = 'pending';
    if (mpStatus === 'approved') paymentStatus = 'approved';
    else if (mpStatus === 'rejected' || mpStatus === 'cancelled') paymentStatus = 'rejected';

    // Traer orden para idempotencia
    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id,status,payment_status')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      console.warn('Order not found for webhook orderId:', orderId);
      return json(res, 200, { ok: true, received: true });
    }

    // Actualizar estado de pago
    await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        mp_payment_id: String(paymentId),
        mp_status: mpStatus,
        mp_status_detail: statusDetail,
      })
      .eq('id', orderId);

    // Si ya estaba pagada, NO descontar stock de nuevo
    if (existingOrder.status === 'paid') {
      return json(res, 200, { ok: true });
    }

    if (paymentStatus === 'approved') {
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (!iErr && items?.length) {
        for (const it of items) {
          const productId = it.product_id;
          const qty = Number(it.quantity || 0);
          if (!qty) continue;

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

        await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
      }
    } else if (paymentStatus === 'rejected') {
      await supabase.from('orders').update({ status: 'payment_failed' }).eq('id', orderId);
    }

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    // Devolver 200 para evitar reintentos infinitos
    return json(res, 200, { ok: true, received: true });
  }
};

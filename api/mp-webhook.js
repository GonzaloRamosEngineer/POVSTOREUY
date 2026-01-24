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

function safeParseJson(input) {
  try {
    if (!input) return null;
    if (typeof input === 'object') return input;
    return JSON.parse(input);
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN; // tu estándar ✅
    if (!accessToken) return json(res, 500, { error: 'Missing MP_ACCESS_TOKEN env var' });

    const supabase = getSupabaseAdmin();

    // PaymentId: query o body (MP puede variar)
    const q = req.query || {};
    let paymentId = q['data.id'] || q.id || q['data[id]'] || null;

    if (!paymentId && req.body) {
      const body = safeParseJson(req.body);
      paymentId = body?.data?.id || body?.id || null;
    }

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

    // Map MP -> enums reales
    let payment_status = 'pending';  // enum: pending|completed|failed|refunded
    let order_status = 'pending';    // enum: pending|processing|completed|cancelled

    if (mpStatus === 'approved') {
      payment_status = 'completed';
      order_status = 'processing'; // o 'completed' si querés cerrar al pagar
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      payment_status = 'failed';
      order_status = 'cancelled';
    }

    // Traer orden para idempotencia real
    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id, payment_status, order_status, notes')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      console.warn('Order not found for webhook orderId:', orderId);
      return json(res, 200, { ok: true, received: true });
    }

    const alreadyCompleted = existingOrder.payment_status === 'completed';

    // Guardar trazas MP en notes (porque no hay columnas mp_*)
    const prevNotes = (() => {
      try { return existingOrder.notes ? JSON.parse(existingOrder.notes) : {}; } catch { return {}; }
    })();

    const nextNotes = {
      ...prevNotes,
      mp_last_event: {
        payment_id: String(paymentId),
        status: mpStatus,
        status_detail: statusDetail,
        received_at: new Date().toISOString(),
      },
    };

    // Actualizar orden con enums correctos + payment_id real
    await supabase
      .from('orders')
      .update({
        payment_status,
        order_status,
        payment_id: String(paymentId),
        notes: JSON.stringify(nextNotes),
      })
      .eq('id', orderId);

    // Si ya estaba completed, NO descontar stock de nuevo
    if (alreadyCompleted) {
      return json(res, 200, { ok: true });
    }

    // Si se completó el pago, descontar stock (tu trigger log_inventory_change lo registra)
    if (payment_status === 'completed') {
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
      }
    }

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    // 200 para evitar reintentos infinitos
    return json(res, 200, { ok: true, received: true });
  }
};

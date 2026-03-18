import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { applyOrderStockOnce } from '../../../lib/stock/applyOrderStockOnce';

export const dynamic = 'force-dynamic';

async function mpGetPayment(accessToken: string, paymentId: string) {
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`MP payment error: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

function mapMpToDbStatuses(mpStatus: string) {
  let payment_status = 'pending';
  let order_status = 'pending';

  if (mpStatus === 'approved') {
    payment_status = 'completed';
    order_status = 'processing';
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    payment_status = 'failed';
    order_status = 'cancelled';
  } else if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
    payment_status = 'refunded';
    order_status = 'cancelled';
  }
  return { payment_status, order_status };
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ error: 'Missing MP_ACCESS_TOKEN' }, { status: 500 });

    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const id = searchParams.get('id') || searchParams.get('data.id');

    if (!id) {
      console.warn('Webhook without ID');
      return NextResponse.json({ ok: true });
    }

    const payment = await mpGetPayment(accessToken, id);
    const orderId = payment.external_reference || payment.metadata?.order_id || payment.metadata?.orderId;

    if (!orderId) {
      console.warn('Payment without orderId:', id);
      return NextResponse.json({ ok: true, received: true });
    }

    const { payment_status, order_status } = mapMpToDbStatuses(payment.status);

    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id, payment_status, stock_applied_at')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      console.warn('Order not found:', orderId);
      return NextResponse.json({ ok: true });
    }

    const targetIsCompleted = payment_status === 'completed';
    const targetIsFailed = payment_status === 'failed';

    if ((existingOrder.payment_status === 'completed' && targetIsFailed) || (existingOrder.payment_status === 'failed' && targetIsCompleted)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid webhook transition from payment_status='${existingOrder.payment_status}' to '${payment_status}'`,
        },
        { status: 409 }
      );
    }

    const sameStatus = existingOrder.payment_status === payment_status;
    const mustRecoverStock = targetIsCompleted && sameStatus && !existingOrder.stock_applied_at;

    if (!sameStatus) {
      const { error: upErr } = await supabase
        .from('orders')
        .update({
          payment_status,
          order_status,
          payment_id: String(id),
          mp_status: payment.status,
          mp_status_detail: payment.status_detail,
        })
        .eq('id', orderId);

      if (upErr) {
        console.error('Failed updating order:', upErr);
        return NextResponse.json({ ok: true });
      }
    } else if (!mustRecoverStock) {
      return NextResponse.json({ ok: true, no_op: true, reason: 'same_payment_status' });
    }

    if (targetIsCompleted) {
      console.info('[stock] mp-webhook:apply_attempt', {
        orderId,
        paymentId: String(id),
        mpStatus: payment.status,
        existingPaymentStatus: existingOrder.payment_status,
        existingStockAppliedAt: existingOrder.stock_applied_at,
        sameStatus,
        mustRecoverStock,
      });

      const stockResult = await applyOrderStockOnce({
        supabase,
        orderId,
        source: 'mp-webhook',
      });

      if (!stockResult.ok) {
        return NextResponse.json(
          { ok: false, error: `stock_apply_failed:${stockResult.reason}` },
          { status: 500 }
        );
      }

      if (stockResult.no_op) {
        console.warn('[stock] mp-webhook:no_op', {
          orderId,
          paymentId: String(id),
          reason: stockResult.reason,
        });
        return NextResponse.json({ ok: true, no_op: true, reason: stockResult.reason });
      }

      console.info('[stock] mp-webhook:apply_success', {
        orderId,
        paymentId: String(id),
        reason: stockResult.reason,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook Error:', e);
    return NextResponse.json({ ok: true });
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { applyOrderStockOnce } from '../../../lib/stock/applyOrderStockOnce';
import { verifyMpWebhookSignature } from '@/lib/mp/verifyWebhookSignature';
import { logWebhookEvent } from '@/lib/logging/webhookLogger';
// IMPORTAMOS EL DICCIONARIO
import { apiErrorMessages } from '@/messages/apiErrorMessages';

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
  const msgs = apiErrorMessages.mpWebhook;

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ error: msgs.missingToken }, { status: 500 });

    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logWebhookEvent('error', 'MP_WEBHOOK_SECRET missing');
      return NextResponse.json({ error: msgs.missingWebhookSecret }, { status: 500 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const id = searchParams.get('id') || searchParams.get('data.id');

    const verification = verifyMpWebhookSignature({
      signatureHeader: request.headers.get('x-signature'),
      requestIdHeader: request.headers.get('x-request-id'),
      dataId: id,
      secret: webhookSecret,
    });

    if (!verification.ok) {
      logWebhookEvent('warn', 'signature rejected', { reason: verification.reason });
      return NextResponse.json(
        { error: msgs.invalidSignature(verification.reason) },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (!id) {
      // Firma válida pero sin id — MP no debería reintentar (payload malformado).
      logWebhookEvent('warn', 'webhook without payment id');
      return NextResponse.json({ ok: true, reason: 'missing_id' });
    }

    const payment = await mpGetPayment(accessToken, id);
    const orderId = payment.external_reference || payment.metadata?.order_id || payment.metadata?.orderId;

    if (!orderId) {
      // Payment sin external_reference — no podemos mapear a orden, MP no debería reintentar.
      logWebhookEvent('warn', 'payment without orderId', { paymentId: String(id), mpStatus: payment.status });
      return NextResponse.json({ ok: true, reason: 'missing_order_id', received: true });
    }

    const { payment_status, order_status } = mapMpToDbStatuses(payment.status);

    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id, payment_status, stock_applied_at')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      // Orden referenciada por el payment no existe en nuestra DB — reintentar no la va a crear.
      logWebhookEvent('warn', 'order not found in DB', {
        paymentId: String(id),
        orderId,
        errorMessage: getErr?.message,
      });
      return NextResponse.json({ ok: true, reason: 'order_not_found' });
    }

    const targetIsCompleted = payment_status === 'completed';
    const targetIsFailed = payment_status === 'failed';

    if ((existingOrder.payment_status === 'completed' && targetIsFailed) || (existingOrder.payment_status === 'failed' && targetIsCompleted)) {
      return NextResponse.json(
        {
          ok: false,
          error: msgs.invalidTransition(existingOrder.payment_status, payment_status),
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
        // Fallo transitorio nuestro (DB no disponible, lock, etc.) — devolvemos 500 para que MP reintente.
        logWebhookEvent('error', 'failed updating order', {
          paymentId: String(id),
          orderId,
          mpStatus: payment.status,
          errorMessage: upErr.message,
        });
        return NextResponse.json(
          { ok: false, error: msgs.dbUpdateFailed },
          { status: 500 }
        );
      }
    } else if (!mustRecoverStock) {
      return NextResponse.json({ ok: true, no_op: true, reason: 'same_payment_status' });
    }

    if (targetIsCompleted) {
      const stockResult = await applyOrderStockOnce({
        supabase,
        orderId,
      });

      if (!stockResult.ok) {
        // Insufficient stock al confirmar pago: retry de MP no ayuda (el stock
        // no se arregla en segundos). Devolvemos 200 con reason en body para
        // que MP no reintente, log warn estructurado para alerta operacional,
        // y dejamos la orden con stock_applied_at=null para que el admin la
        // vea en el dashboard y reconcilie (refund o conseguir inventario).
        if (stockResult.reason === 'insufficient_stock') {
          const detail = stockResult.shortfall
            ? `${stockResult.shortfall.name} (necesita ${stockResult.shortfall.needed}, disponible ${stockResult.shortfall.available})`
            : 'shortfall sin detalle';
          logWebhookEvent('warn', 'stock apply blocked by insufficient stock', {
            paymentId: String(id),
            orderId,
            reason: stockResult.reason,
            shortfall: stockResult.shortfall,
          });
          return NextResponse.json({
            ok: false,
            no_op: false,
            reason: 'insufficient_stock',
            error: msgs.insufficientStock(detail),
            shortfall: stockResult.shortfall,
          });
        }

        // Otros errores (DB transitorio, malformado): 500 → MP reintenta.
        logWebhookEvent('error', 'stock apply failed', {
          paymentId: String(id),
          orderId,
          reason: stockResult.reason,
        });
        return NextResponse.json(
          { ok: false, error: msgs.stockApplyFailed(stockResult.reason) },
          { status: 500 }
        );
      }

      if (stockResult.no_op) {
        return NextResponse.json({ ok: true, no_op: true, reason: stockResult.reason });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Excepción no manejada — algo se rompió de nuestro lado. Devolvemos 500 para que MP reintente.
    logWebhookEvent('error', 'unhandled exception', {
      errorName: e?.name,
      errorMessage: e?.message,
    });
    return NextResponse.json(
      { ok: false, error: msgs.unhandledException },
      { status: 500 }
    );
  }
}
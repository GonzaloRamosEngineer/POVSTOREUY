import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
    
    const topic = searchParams.get('topic') || searchParams.get('type');
    const id = searchParams.get('id') || searchParams.get('data.id');

    if (!id) {
      console.warn('Webhook without ID');
      return NextResponse.json({ ok: true }); 
    }

    // 1. Verificar Estado en MP
    const payment = await mpGetPayment(accessToken, id);
    const orderId = payment.external_reference || payment.metadata?.order_id || payment.metadata?.orderId;

    if (!orderId) {
      console.warn('Payment without orderId:', id);
      return NextResponse.json({ ok: true, received: true });
    }

    const { payment_status, order_status } = mapMpToDbStatuses(payment.status);

    // 2. Verificar si ya se procesó
    const { data: existingOrder, error: getErr } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .single();

    if (getErr || !existingOrder) {
      console.warn('Order not found:', orderId);
      return NextResponse.json({ ok: true });
    }

    if (existingOrder.payment_status === 'completed') {
      return NextResponse.json({ ok: true });
    }

    // 3. Actualizar Orden
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

    // 4. Descontar Stock (si se aprobó)
    if (payment_status === 'completed') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (items) {
        for (const it of items) {
          const { data: p } = await supabase.from('products').select('stock_count').eq('id', it.product_id).single();
          if (p) {
            const next = Math.max(0, (p.stock_count || 0) - it.quantity);
            await supabase.from('products').update({ stock_count: next }).eq('id', it.product_id);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error('Webhook Error:', e);
    return NextResponse.json({ ok: true });
  }
}
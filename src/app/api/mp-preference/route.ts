import { NextResponse } from 'next/server';
// @ts-ignore
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { signOrderLookupToken } from '@/lib/orders/orderLookupToken';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit/apply';
import { getMpPreferenceLimiter } from '@/lib/rateLimit/limiters';
// IMPORTAMOS EL DICCIONARIO
import { apiErrorMessages } from '@/messages/apiErrorMessages';

// IMPORTANTE: Forzamos dinámico para que no cachee las credenciales
export const dynamic = 'force-dynamic';

async function mpCreatePreference(accessToken: string, preference: any, idempotencyKey: string) {
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
  
  if (!resp.ok) {
    console.error("❌ MP API Error:", JSON.stringify(data));
    throw new Error(`MP preference error: ${resp.status} - ${data.message || JSON.stringify(data)}`);
  }
  
  return data;
}

export async function POST(request: Request) {
  const msgs = apiErrorMessages.mpPreference;

  try {
    const { blockedResponse } = await applyRateLimit(getClientIp(request), [getMpPreferenceLimiter()]);
    if (blockedResponse) return blockedResponse;

    const supabase = getSupabaseAdmin();
    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:4028';

    if (!accessToken) {
      console.error("Falta MP_ACCESS_TOKEN");
      return NextResponse.json({ error: msgs.missingToken }, { status: 500 });
    }

    const lookupSecret = process.env.ORDER_LOOKUP_SECRET;
    if (!lookupSecret) {
      console.error('Falta ORDER_LOOKUP_SECRET');
      return NextResponse.json({ error: 'Server misconfigured: ORDER_LOOKUP_SECRET' }, { status: 500 });
    }

    const body = await request.json();
    const { orderId } = body || {};

    if (!orderId) return NextResponse.json({ error: msgs.missingOrderId }, { status: 400 });

    // 1. Cargar Orden
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, customer_name, payment_method, payment_status, order_status, total, shipping_cost, mp_preference_id')
      .eq('id', orderId)
      .single();

    if (oErr || !order) {
      console.error("Orden no encontrada:", oErr);
      return NextResponse.json({ error: msgs.orderNotFound }, { status: 404 });
    }

    // 1b. Guard de estado (PF-07): no generar preference sobre órdenes ya pagadas/canceladas/refunded.
    // Permitir solo payment_status pendiente o failed (retry intencional) y order_status no cancelado.
    if (order.payment_status === 'completed') {
      return NextResponse.json({ error: msgs.orderAlreadyPaid }, { status: 409 });
    }
    if (order.payment_status === 'refunded') {
      return NextResponse.json({ error: msgs.orderRefunded }, { status: 409 });
    }
    if (order.order_status === 'cancelled') {
      return NextResponse.json({ error: msgs.orderCancelled }, { status: 409 });
    }

    // 2. Cargar Items
    const { data: orderItems, error: iErr } = await supabase
      .from('order_items')
      .select('line_type, product_name, product_model, quantity, unit_price')
      .eq('order_id', orderId);

    if (iErr) return NextResponse.json({ error: msgs.itemsLoadFailed, details: iErr.message }, { status: 500 });
    if (!orderItems || orderItems.length === 0) return NextResponse.json({ error: msgs.noItems }, { status: 400 });

    // Mapeo de items comerciales únicamente (Etapa 2A)
    const commercialItems = (orderItems || []).filter((it: any) => {
      const lineType = String(it?.line_type || 'simple');
      return lineType === 'simple' || lineType === 'pack_primary';
    });

    if (commercialItems.length === 0) {
      return NextResponse.json({ error: msgs.noCommercialItems }, { status: 400 });
    }

    const mpItems = commercialItems.map((it: any) => ({
      title: `${it.product_name}${it.product_model ? ` - ${it.product_model}` : ''}`,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      currency_id: 'UYU',
    }));

    // Shipping como ítem
    const shippingCost = Number(order.shipping_cost || 0);
    if (shippingCost > 0) {
      mpItems.push({
        title: msgs.shippingItemTitle,
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'UYU',
      });
    }

    const lookupToken = signOrderLookupToken(orderId, lookupSecret);

    // 3. Crear Preferencia
    const preference = {
      items: mpItems,
      payer: {
        email: order.customer_email || msgs.defaultClientEmail,
        name: order.customer_name || msgs.defaultClientName,
      },
      external_reference: orderId,
      notification_url: `${siteUrl}/api/mp-webhook`,
      back_urls: {
        success: `${siteUrl}/order-confirmation?orderId=${orderId}&token=${lookupToken}&status=success`,
        pending: `${siteUrl}/order-confirmation?orderId=${orderId}&token=${lookupToken}&status=pending`,
        failure: `${siteUrl}/order-confirmation?orderId=${orderId}&token=${lookupToken}&status=failure`,
      },
      auto_return: 'approved',
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
      statement_descriptor: msgs.statementDescriptor
    };

    console.log("Generando preferencia MP con URL base:", siteUrl);

    const idempotencyKey = `pref-${orderId}-${Date.now()}`;
    const mpPref = await mpCreatePreference(accessToken, preference, idempotencyKey);

    // 4. Guardar datos MP en DB
    await supabase
      .from('orders')
      .update({
        mp_preference_id: mpPref.id,
        mp_init_point: mpPref.init_point || null,
        mp_sandbox_init_point: mpPref.sandbox_init_point || null,
      })
      .eq('id', orderId);

    return NextResponse.json({
      ok: true,
      orderId,
      preferenceId: mpPref.id,
      initPoint: mpPref.init_point,
      sandboxInitPoint: mpPref.sandbox_init_point,
    });

  } catch (e: any) {
    console.error("Server Error en MP Preference:", e);
    return NextResponse.json({ error: msgs.unexpected, details: e.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
// @ts-ignore
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
    // Logueamos el error exacto de MercadoPago para debugging
    console.error("❌ MP API Error:", JSON.stringify(data));
    throw new Error(`MP preference error: ${resp.status} - ${data.message || JSON.stringify(data)}`);
  }
  
  return data;
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    // --- CORRECCIÓN CRÍTICA AQUÍ ---
    // Aseguramos que siteUrl nunca sea undefined.
    // Prioridad: 1. Variable Pública, 2. Variable Privada, 3. Hardcode Localhost (para que no falle en tu máquina)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:4028';

    if (!accessToken) {
      console.error("Falta MP_ACCESS_TOKEN");
      return NextResponse.json({ error: 'Missing MP_ACCESS_TOKEN env var' }, { status: 500 });
    }

    const body = await request.json();
    const { orderId } = body || {};

    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    // 1. Cargar Orden
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, customer_name, payment_method, payment_status, total, shipping_cost, mp_preference_id')
      .eq('id', orderId)
      .single();

    if (oErr || !order) {
      console.error("Orden no encontrada:", oErr);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Cargar Items
    const { data: orderItems, error: iErr } = await supabase
      .from('order_items')
      .select('product_name, product_model, quantity, unit_price')
      .eq('order_id', orderId);

    if (iErr) return NextResponse.json({ error: 'Failed to load order items', details: iErr.message }, { status: 500 });
    if (!orderItems || orderItems.length === 0) return NextResponse.json({ error: 'Order has no items' }, { status: 400 });

    // Mapeo de items
    const mpItems = orderItems.map((it: any) => ({
      title: `${it.product_name}${it.product_model ? ` - ${it.product_model}` : ''}`,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      currency_id: 'UYU',
    }));

    // Shipping como ítem
    const shippingCost = Number(order.shipping_cost || 0);
    if (shippingCost > 0) {
      mpItems.push({
        title: 'Costo de envío',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'UYU',
      });
    }

    // 3. Crear Preferencia
    // Aquí usamos la variable siteUrl que aseguramos arriba
    const preference = {
      items: mpItems,
      payer: {
        email: order.customer_email || 'test_user_123@test.com', // MP requiere email válido
        name: order.customer_name || 'Cliente',
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
      statement_descriptor: "POV STORE UY"
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
    return NextResponse.json({ error: 'Unexpected error', details: e.message }, { status: 500 });
  }
}
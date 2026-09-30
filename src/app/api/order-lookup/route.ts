// src/app/api/order-lookup/route.ts
//
// Seguimiento público de pedidos para checkout invitado (no hay cuentas).
//
// El cliente prueba que el pedido es suyo con DOS datos que sólo él tiene:
// número de pedido + email de la compra. Si coinciden, se le entrega el
// mismo token HMAC que ya usan el checkout y los mails, y de ahí en más
// consume `/api/order-details` como siempre. Este endpoint NO devuelve PII:
// sólo el id y el token.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { signOrderLookupToken } from '@/lib/orders/orderLookupToken';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit/apply';
import { getOrderLookupLimiters } from '@/lib/rateLimit/limiters';
import { orderLookupMessages } from '@/messages/orderLookupMessages';

export const dynamic = 'force-dynamic';

const msgs = orderLookupMessages.errors;

/** Tolera que el cliente escriba "pov 123456", "POV123456" o sólo "123456". */
function normalizeOrderNumber(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d+$/.test(cleaned)) return `POV-${cleaned}`;
  if (/^POV\d+$/.test(cleaned)) return cleaned.replace(/^POV/, 'POV-');
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    // El rate-limit es la defensa real contra fuerza bruta sobre el par
    // (nro, email). Va ANTES de tocar la DB.
    const { perMinute, perHour } = getOrderLookupLimiters();
    const { blockedResponse } = await applyRateLimit(getClientIp(request), [perMinute, perHour]);
    if (blockedResponse) return blockedResponse;

    const secret = process.env.ORDER_LOOKUP_SECRET;
    if (!secret) {
      console.error('Falta ORDER_LOOKUP_SECRET');
      return NextResponse.json({ error: msgs.serverError }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const rawOrderNumber = typeof body?.orderNumber === 'string' ? body.orderNumber : '';
    const rawEmail = typeof body?.email === 'string' ? body.email : '';

    if (!rawOrderNumber.trim() || !rawEmail.trim()) {
      return NextResponse.json({ error: msgs.missingFields }, { status: 400 });
    }

    if (!rawEmail.includes('@')) {
      return NextResponse.json({ error: msgs.invalidEmail }, { status: 400 });
    }

    const orderNumber = normalizeOrderNumber(rawOrderNumber);
    const email = rawEmail.trim().toLowerCase();

    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, customer_email')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      console.error('order-lookup: error consultando la orden:', error.message);
      return NextResponse.json({ error: msgs.serverError }, { status: 500 });
    }

    // Mismo 404 para "no existe" y "el email no coincide": si diferenciáramos,
    // el endpoint confirmaría qué números de pedido existen.
    const emailMatches =
      !!order?.customer_email && order.customer_email.trim().toLowerCase() === email;

    if (!order || !emailMatches) {
      return NextResponse.json({ error: msgs.notFound }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      token: signOrderLookupToken(order.id, secret),
    });
  } catch (err: any) {
    console.error('order-lookup: excepción no manejada:', err?.message);
    return NextResponse.json({ error: msgs.serverError }, { status: 500 });
  }
}

// src/lib/email/sendOrderStatusEmail.ts
//
// Punto único donde se decide QUÉ mail dispara un cambio de estado de orden.
// Server-only (usa el client service-role para leer los items).
//
// Contrato: nunca lanza. Si el mail falla, la orden ya quedó actualizada y el
// admin no debe ver un 500 por eso — queda el log y se puede reenviar.

import type { SupabaseClient } from '@supabase/supabase-js';
import { isPickup, PICKUP_ADDRESS } from '@/lib/orders/deliveryMethod';
import { renderOrderEmail, type OrderEmailKind } from './renderOrderEmail';
import type { OrderEmailItemRow } from './orderEmailData';
import { sendEmail, type SendEmailResult } from './resendClient';

/** Estados de orden que le avisan algo al cliente. El resto no manda mail. */
const STATUS_TO_EMAIL: Record<string, OrderEmailKind> = {
  processing: 'processing',
  ready: 'ready',
  shipped: 'shipped',
};

export type OrderRowForEmail = {
  id: string;
  order_number: string;
  customer_email?: string | null;
  customer_name?: string | null;
  delivery_method?: string | null;
  subtotal?: number | null;
  shipping_cost?: number | null;
  total?: number | null;
  tracking_number?: string | null;
};

export type OrderEmailOutcome =
  | { sent: false; reason: 'status_not_notifiable' | 'no_customer_email' | 'send_failed' }
  | { sent: true; skipped: boolean };

/** True si la transición de estado amerita avisarle al cliente. */
export function shouldNotifyCustomer(previousStatus: string | null | undefined, nextStatus: string): boolean {
  if (!(nextStatus in STATUS_TO_EMAIL)) return false;
  // Sin cambio real de estado no se reenvía: evita duplicados cuando el admin
  // guarda dos veces o toca sólo el tracking.
  return previousStatus !== nextStatus;
}

export async function sendOrderStatusEmail({
  supabase,
  order,
  status,
}: {
  supabase: SupabaseClient;
  order: OrderRowForEmail;
  status: string;
}): Promise<OrderEmailOutcome> {
  const kind = STATUS_TO_EMAIL[status];
  if (!kind) return { sent: false, reason: 'status_not_notifiable' };

  const to = order.customer_email?.trim();
  if (!to) {
    console.warn(`[email] Orden ${order.order_number} sin customer_email — no se envía`);
    return { sent: false, reason: 'no_customer_email' };
  }

  let items: OrderEmailItemRow[] = [];
  const { data, error } = await supabase
    .from('order_items')
    .select('product_name, quantity, unit_price, total_price, line_type, pack_group_id')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  if (error) {
    // El mail sigue valiendo sin el detalle de ítems; no lo abortamos por esto.
    console.error(`[email] No se pudieron leer los items de ${order.order_number}:`, error.message);
  } else {
    items = (data || []) as OrderEmailItemRow[];
  }

  const pickup = isPickup(order as any);

  const { subject, html, text } = renderOrderEmail({
    kind,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    items,
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    total: order.total,
    isPickup: pickup,
    trackingNumber: order.tracking_number,
    pickupAddress: pickup ? PICKUP_ADDRESS : null,
  });

  const result: SendEmailResult = await sendEmail({
    to,
    subject,
    html,
    text,
    tag: `order-${kind}`,
  });

  if (!result.ok) return { sent: false, reason: 'send_failed' };
  return { sent: true, skipped: Boolean((result as any).skipped) };
}

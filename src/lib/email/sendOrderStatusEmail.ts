// src/lib/email/sendOrderStatusEmail.ts
//
// Punto único donde se decide QUÉ mail recibe el cliente y CUÁNDO.
// Server-only (usa el client service-role para leer los items).
//
// Contrato: nunca lanza. Si el mail falla, la orden ya quedó actualizada y el
// admin no debe ver un 500 por eso — queda el log y se puede reenviar.

import type { SupabaseClient } from '@supabase/supabase-js';
import { isOrderNotifiable } from '@/config/admin';
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
  created_at?: string | null;
};

export type OrderEmailOutcome =
  | {
      sent: false;
      reason:
        | 'status_not_notifiable'
        | 'before_cutoff'
        | 'muted_by_admin'
        | 'no_customer_email'
        | 'send_failed';
    }
  | { sent: true; skipped: boolean };

/**
 * True si la transición de estado amerita avisarle al cliente.
 * Exige cambio REAL de estado: guardar dos veces, o tocar sólo el tracking,
 * no reenvía el mail.
 */
export function shouldNotifyCustomer(
  previousStatus: string | null | undefined,
  nextStatus: string
): boolean {
  if (!(nextStatus in STATUS_TO_EMAIL)) return false;
  return previousStatus !== nextStatus;
}

/**
 * Envía un mail de orden. Acá viven los dos frenos:
 *  - `notify`: el admin puede silenciar un envío puntual desde el panel.
 *  - corte por fecha: las órdenes previas a ORDER_EMAIL_CUTOFF nunca notifican
 *    (el histórico ya se comunicó a mano; ver src/config/admin.ts).
 */
export async function sendOrderEmail({
  supabase,
  order,
  kind,
  notify = true,
}: {
  supabase: SupabaseClient;
  order: OrderRowForEmail;
  kind: OrderEmailKind;
  notify?: boolean;
}): Promise<OrderEmailOutcome> {
  if (!notify) {
    console.log(`[email] Orden ${order.order_number}: aviso silenciado por el admin`);
    return { sent: false, reason: 'muted_by_admin' };
  }

  if (!isOrderNotifiable(order.created_at)) {
    console.log(
      `[email] Orden ${order.order_number} es anterior al corte de mails — no se notifica`
    );
    return { sent: false, reason: 'before_cutoff' };
  }

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

/** Mail disparado por un cambio de estado de la orden (panel admin). */
export async function sendOrderStatusEmail({
  supabase,
  order,
  status,
  notify = true,
}: {
  supabase: SupabaseClient;
  order: OrderRowForEmail;
  status: string;
  notify?: boolean;
}): Promise<OrderEmailOutcome> {
  const kind = STATUS_TO_EMAIL[status];
  if (!kind) return { sent: false, reason: 'status_not_notifiable' };
  return sendOrderEmail({ supabase, order, kind, notify });
}

/**
 * Mail de confirmación de compra. Se dispara cuando el pago se acredita de
 * verdad (webhook de MP, o confirmación manual de una transferencia), NO al
 * crear la orden: así no le llega nada a quien abandonó el checkout sin pagar.
 */
export async function sendOrderConfirmationEmail({
  supabase,
  order,
  notify = true,
}: {
  supabase: SupabaseClient;
  order: OrderRowForEmail;
  notify?: boolean;
}): Promise<OrderEmailOutcome> {
  return sendOrderEmail({ supabase, order, kind: 'confirmed', notify });
}

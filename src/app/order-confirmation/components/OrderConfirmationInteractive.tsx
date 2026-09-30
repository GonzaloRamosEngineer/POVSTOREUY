'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

import OrderStatusHero from './OrderStatusHero';
import OrderItemsCard, { type OrderLineView } from './OrderItemsCard';
import DeliveryCard from './DeliveryCard';
import PaymentCard from './PaymentCard';
import HelpCard from './HelpCard';

import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import { isPickup, PICKUP_ADDRESS, type DeliveryMethod } from '@/lib/orders/deliveryMethod';
import { getOrderProgress } from '@/lib/orders/orderProgress';
import { groupOrderLines } from '@/lib/orders/groupOrderLines';
import { isOrderNotifiable } from '@/config/admin';
import { trackPurchase } from '@/lib/analytics/metaPixel';
// Alineado con currency_id en mp-preference.
import { STORE_CURRENCY } from '@/lib/format/currency';


type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

interface ApiOrderItem {
  id: string;
  product_name: string;
  product_model: string;
  product_image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_type?: 'simple' | 'pack_primary' | 'pack_component' | null;
  pack_group_id?: string | null;
}

interface ApiOrder {
  id: string;
  order_number: string;
  created_at: string;

  subtotal: string | number;
  shipping_cost: string | number;
  total: string | number;

  order_status: string;
  tracking_number?: string | null;
  payment_method: string;
  payment_status: PaymentStatus;

  payment_id: string | null;

  customer_name: string;
  customer_email: string;
  customer_phone: string;

  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string;

  delivery_method?: DeliveryMethod | null;

  notes: string | null;
}

interface ApiResponse {
  ok: boolean;
  order: ApiOrder;
  items: ApiOrderItem[];
}

function formatUY(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toNumber(n: any) {
  const v = typeof n === 'string' ? Number(n) : Number(n ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function computeUIStatus(urlStatus: string | null, dbStatus?: PaymentStatus): PaymentStatus {
  if (dbStatus) return dbStatus;
  if (urlStatus === 'success') return 'completed';
  if (urlStatus === 'pending') return 'pending';
  return 'failed';
}

const OrderConfirmationInteractive: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId');
  const token = searchParams.get('token');
  const urlStatus = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [items, setItems] = useState<ApiOrderItem[]>([]);

  const m = orderTrackingMessages;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!orderId) {
          setErrorMsg(m.errors.body);
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/api/order-details?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token ?? '')}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const data = (await res.json().catch(() => null)) as ApiResponse | null;

        if (!res.ok || !data?.ok) {
          throw new Error(m.errors.body);
        }

        if (!alive) return;
        setOrder(data.order);
        setItems(data.items || []);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || m.errors.body);
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [orderId, token, m.errors.body]);

  const ui = useMemo(() => {
    if (!order) return null;

    const subtotal = toNumber(order.subtotal);
    const shipping = toNumber(order.shipping_cost);
    const total = toNumber(order.total);

    const paymentStatus = computeUIStatus(urlStatus, order.payment_status);
    const pickup = isPickup(order);

    const progress = getOrderProgress({
      paymentStatus,
      orderStatus: order.order_status,
      isPickup: pickup,
    });

    // Lo que ve el cliente: packs armados (primary + "Incluye"), sin las
    // filas internas en $0. Misma regla que los mails.
    const lines: OrderLineView[] = groupOrderLines(items).map(({ row, components }) => ({
      key: row.id,
      name: row.product_name,
      image: row.product_image_url || '',
      quantity: toNumber(row.quantity),
      totalPrice: toNumber(row.total_price),
      components: components.map((c) => ({
        key: c.id,
        name: c.product_name,
        quantity: toNumber(c.quantity),
      })),
    }));

    // La nota de email sólo aparece si es VERDAD: las órdenes anteriores al
    // corte de mails nunca recibieron uno (ver ORDER_EMAIL_CUTOFF).
    const notifiable = isOrderNotifiable(order.created_at);
    const emailNote = !notifiable || !order.customer_email
      ? null
      : paymentStatus === 'completed'
        ? m.emailNote.sent(order.customer_email)
        : progress.kind === 'awaiting_payment'
          ? m.emailNote.willSend(order.customer_email)
          : null;

    return {
      orderNumber: order.order_number,
      orderDate: formatUY(order.created_at),
      subtotal,
      shipping,
      total,
      paymentMethod: order.payment_method,
      paymentStatus,
      transactionId: order.payment_id,
      progress,
      lines,
      emailNote,
      pickup,

      // Filas crudas: SÓLO para el evento Purchase del pixel, que las
      // reportaba así antes del rediseño. No cambiar sin revisar Meta.
      items: items.map((it) => ({
        id: it.id,
        quantity: toNumber(it.quantity),
        price: toNumber(it.unit_price),
      })),
    };
  }, [order, items, urlStatus, m]);

  // Meta Pixel — evento Purchase. Sólo cuando el pago está confirmado
  // (completed) y con el total real de la orden en UYU. Dedup por order.id
  // (localStorage) para no doblar la conversión ante refresh/re-render. El
  // eventId = order.id se reusará en la Conversions API server-side (fase 2)
  // para que Meta deduplique el evento pixel vs. server.
  useEffect(() => {
    if (!order || !ui) return;
    if (ui.paymentStatus !== 'completed') return;

    const dedupeKey = `fb_purchase_${order.id}`;
    try {
      if (localStorage.getItem(dedupeKey)) return;
    } catch {
      // localStorage inaccesible (modo privado, etc.) — seguimos igual.
    }

    trackPurchase({
      value: ui.total,
      currency: STORE_CURRENCY,
      orderNumber: ui.orderNumber,
      eventId: order.id,
      numItems: ui.items.reduce((n, it) => n + it.quantity, 0),
      contents: ui.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        item_price: it.price,
      })),
    });

    try {
      localStorage.setItem(dedupeKey, '1');
    } catch {
      // idem: sin persistencia el evento igual se disparó.
    }
  }, [order, ui]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10" aria-busy="true">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-background" />
          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-80 animate-pulse rounded-2xl border border-border bg-background" />
            <div className="h-56 animate-pulse rounded-2xl border border-border bg-background" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !ui || !order) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-zinc-500/10">
            <Icon name="MagnifyingGlassIcon" size={24} className="text-zinc-600" />
          </span>
          <h1 className="mt-4 font-heading text-xl font-bold tracking-tight text-foreground">{m.errors.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.errors.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/seguimiento"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition-transform duration-150 ease-out hover:bg-red-700 active:scale-[0.97]"
            >
              {m.errors.lookup}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {m.errors.home}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { progress } = ui;
  const arrived = progress.kind === 'delivered';
  const closed = progress.kind === 'cancelled' || progress.kind === 'refunded' || progress.kind === 'payment_failed';

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <OrderStatusHero
          progress={progress}
          orderNumber={ui.orderNumber}
          orderDate={ui.orderDate}
          paymentMethod={ui.paymentMethod}
          trackingNumber={order.tracking_number}
          emailNote={ui.emailNote}
        />

        <div className="mt-4 grid items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4 sm:space-y-6">
            <OrderItemsCard lines={ui.lines} subtotal={ui.subtotal} shipping={ui.shipping} total={ui.total} />
            <DeliveryCard
              isPickup={ui.pickup}
              pickupAddress={ui.pickup ? PICKUP_ADDRESS : null}
              address={order.shipping_address || ''}
              city={order.shipping_city || ''}
              department={order.shipping_department || ''}
              postalCode={order.shipping_postal_code || ''}
              customerName={order.customer_name}
              customerPhone={order.customer_phone}
              customerEmail={order.customer_email}
              // En camino, el hero ya dice la estimación: no repetirla acá.
              showEstimate={!arrived && !closed && progress.kind !== 'in_transit'}
            />
          </div>

          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
            <PaymentCard
              method={ui.paymentMethod}
              status={ui.paymentStatus}
              total={ui.total}
              transactionId={ui.transactionId}
            />
            <HelpCard orderNumber={ui.orderNumber} />
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 print:hidden sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <Icon name="PrinterIcon" size={18} className="text-muted-foreground" />
            {m.actions.print}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white transition-transform duration-150 ease-out hover:bg-red-700 active:scale-[0.97]"
          >
            <Icon name="ShoppingBagIcon" size={18} className="text-white" />
            {m.actions.keepShopping}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationInteractive;
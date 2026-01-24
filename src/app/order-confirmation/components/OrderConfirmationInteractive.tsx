'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

import OrderSummaryCard from './OrderSummaryCard';
import CustomerInfoCard from './CustomerInfoCard';
import PaymentStatusCard from './PaymentStatusCard';
import DeliveryInfoCard from './DeliveryInfoCard';
import NextStepsCard from './NextStepsCard';
import EmailConfirmationCard from './EmailConfirmationCard';
import SocialShareCard from './SocialShareCard';

type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

interface ApiOrderItem {
  id: string;
  product_name: string;
  product_model: string;
  product_image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ApiOrder {
  id: string;
  order_number: string;
  created_at: string;

  subtotal: string | number;
  shipping_cost: string | number;
  total: string | number;

  order_status: string;
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

  notes: string | null;
}

interface ApiResponse {
  ok: boolean;
  order: ApiOrder;
  items: ApiOrderItem[];
}

function formatUY(dateIso: string) {
  const d = new Date(dateIso);
  // ojo: si querés exactitud zona horaria, lo ajustamos luego; esto sirve para UI
  return d.toLocaleDateString('es-UY');
}

function toNumber(n: any) {
  const v = typeof n === 'string' ? Number(n) : Number(n ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function computeUIStatus(urlStatus: string | null, dbStatus?: PaymentStatus): PaymentStatus {
  // prioridad: DB (fuente de verdad) si existe
  if (dbStatus) return dbStatus;

  // fallback: query param MP
  if (urlStatus === 'success') return 'completed';
  if (urlStatus === 'pending') return 'pending';
  return 'failed';
}

function parsePickupFromNotes(notes?: string | null) {
  if (!notes) return null;
  const prefix = 'Retiro en local físico:';
  if (!notes.startsWith(prefix)) return null;
  return notes.replace(prefix, '').trim();
}

const OrderConfirmationInteractive: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId');
  const urlStatus = searchParams.get('status'); // success|pending|failure (o lo que venga)

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [items, setItems] = useState<ApiOrderItem[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!orderId) {
          setErrorMsg('Falta orderId en la URL. Volvé al carrito e intentá nuevamente.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/order-details?orderId=${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = (await res.json().catch(() => null)) as ApiResponse | null;

        if (!res.ok || !data?.ok) {
          throw new Error((data as any)?.error || 'No se pudo cargar la orden');
        }

        if (!alive) return;
        setOrder(data.order);
        setItems(data.items || []);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || 'Error al cargar la confirmación');
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const ui = useMemo(() => {
    if (!order) return null;

    const subtotal = toNumber(order.subtotal);
    const shipping = toNumber(order.shipping_cost);
    const total = toNumber(order.total);

    const paymentStatus = computeUIStatus(urlStatus, order.payment_status);

    const pickupAddress = parsePickupFromNotes(order.notes);
    const isPickup = Boolean(pickupAddress);

    const headerTitle =
      paymentStatus === 'completed'
        ? '¡Pedido Confirmado!'
        : paymentStatus === 'pending'
          ? 'Pedido en proceso'
          : 'No se pudo confirmar el pago';

    const headerSubtitle =
      paymentStatus === 'completed'
        ? (isPickup
            ? 'Gracias por tu compra. Tu pedido quedó confirmado para retiro en local.'
            : 'Gracias por tu compra. Tu pedido está siendo preparado para el envío.')
        : paymentStatus === 'pending'
          ? 'Tu pago está pendiente. Apenas se acredite, te avisamos.'
          : 'El pago no se acreditó. Podés reintentar o cambiar el método de pago.';

    const shippingMethod = isPickup ? 'Retiro en Local Físico' : 'Envío a domicilio';

    // estimativo simple; si es retiro, no tiene “fecha entrega”
    const estimatedDelivery = isPickup
      ? 'Coordinaremos por WhatsApp / Email'
      : '24-72 hs hábiles (estimado)';

    const mappedItems = items.map((it) => ({
      id: it.id,
      name: it.product_name,
      model: it.product_model || '',
      quantity: toNumber(it.quantity),
      price: toNumber(it.unit_price),
      image: it.product_image_url || '',
      alt: `${it.product_name}${it.product_model ? ` - ${it.product_model}` : ''}`,
    }));

    return {
      orderNumber: order.order_number,
      orderDate: formatUY(order.created_at),
      subtotal,
      shipping,
      total,

      paymentMethod: order.payment_method === 'mercadopago' ? 'MercadoPago' : 'Transferencia Bancaria',
      paymentStatus,
      transactionId: order.payment_id || '-',

      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,

      shippingAddress: isPickup ? (pickupAddress || '') : (order.shipping_address || ''),
      shippingCity: isPickup ? 'Montevideo' : (order.shipping_city || ''),
      shippingDepartment: isPickup ? 'Montevideo' : (order.shipping_department || ''),
      shippingPostalCode: isPickup ? '' : (order.shipping_postal_code || ''),

      shippingMethod,
      estimatedDelivery,

      items: mappedItems,
      isPickup,
      pickupAddress: pickupAddress || null,
    };
  }, [order, items, urlStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-6">
          <div className="h-96 bg-card animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (errorMsg || !ui) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-card border border-border rounded-lg p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-error/10 rounded-full">
            <Icon name="XCircleIcon" size={34} className="text-error" variant="solid" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Ups…</h1>
          <p className="text-sm text-muted-foreground">{errorMsg || 'No pudimos mostrar la confirmación.'}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => router.push('/shopping-cart')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium"
            >
              <Icon name="ShoppingCartIcon" size={18} className="text-primary-foreground" />
              Volver al carrito
            </button>

            <Link
              href="/homepage"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-md font-medium"
            >
              <Icon name="HomeIcon" size={18} className="text-foreground" />
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = ui.paymentStatus === 'completed';
  const isPending = ui.paymentStatus === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-6 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isSuccess ? 'bg-success/10' : isPending ? 'bg-warning/10' : 'bg-error/10'
          }`}>
            <Icon
              name={isSuccess ? 'CheckCircleIcon' : isPending ? 'ClockIcon' : 'XCircleIcon'}
              size={40}
              className={isSuccess ? 'text-success' : isPending ? 'text-warning' : 'text-error'}
              variant="solid"
            />
          </div>

          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
            {isSuccess ? '¡Pedido Confirmado!' : isPending ? 'Pedido en proceso' : 'Pago no confirmado'}
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isSuccess
              ? (ui.isPickup
                  ? 'Gracias por tu compra. Tu pedido quedó confirmado para retiro en local.'
                  : 'Gracias por tu compra. Tu pedido está siendo preparado para el envío.')
              : isPending
                ? 'Tu pago está pendiente. Si ya pagaste, puede demorar unos minutos en reflejarse.'
                : 'El pago no se acreditó. Podés reintentar el pago o cambiar el método.'}
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <OrderSummaryCard
              orderNumber={ui.orderNumber}
              orderDate={ui.orderDate}
              items={ui.items}
              subtotal={ui.subtotal}
              shipping={ui.shipping}
              total={ui.total}
              paymentMethod={ui.paymentMethod}
            />

            <NextStepsCard />

            <SocialShareCard orderNumber={ui.orderNumber} />
          </div>

          <div className="space-y-6">
            <PaymentStatusCard
              status={ui.paymentStatus === 'completed' ? 'completed' : ui.paymentStatus === 'pending' ? 'pending' : 'failed'}
              transactionId={ui.transactionId}
              paymentMethod={ui.paymentMethod}
              referenceNumber={ui.orderNumber}
            />

            <CustomerInfoCard
              name={ui.customerName}
              email={ui.customerEmail}
              phone={ui.customerPhone}
              address={ui.shippingAddress}
              city={ui.shippingCity}
              department={ui.shippingDepartment}
              postalCode={ui.shippingPostalCode}
            />

            <DeliveryInfoCard
              estimatedDelivery={ui.estimatedDelivery}
              trackingNumber={undefined}
              shippingMethod={ui.shippingMethod}
            />

            <EmailConfirmationCard
              email={ui.customerEmail}
              supportEmail="soporte@povstoreuruguay.com"
              supportPhone="+598 2 123 4567"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/homepage"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-smooth focus-ring"
          >
            <Icon name="HomeIcon" size={20} className="text-primary-foreground" />
            Volver al Inicio
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-md transition-smooth focus-ring"
          >
            <Icon name="PrinterIcon" size={20} className="text-foreground" />
            Imprimir Confirmación
          </button>
        </div>

        {/* Help */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Tenés alguna pregunta sobre tu pedido?
          </p>
          <Link
            href="/homepage"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-smooth"
          >
            Contactar Soporte
            <Icon name="ArrowRightIcon" size={16} className="text-primary" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationInteractive;

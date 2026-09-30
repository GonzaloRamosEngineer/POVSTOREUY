'use client';

import Icon from '@/components/ui/AppIcon';
import type { OrderProgress, ProgressKind } from '@/lib/orders/orderProgress';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import { WHATSAPP_NUMBER } from '@/config/contact';
import { CARRIER_NAME, carrierTrackingUrl } from '@/config/shipping';
import ProgressStepper from './ProgressStepper';
import CopyButton from './CopyButton';
import { TONE } from './tones';

const ICON: Record<ProgressKind, string> = {
  awaiting_payment: 'ClockIcon',
  confirmed: 'CheckCircleIcon',
  preparing: 'CubeIcon',
  ready: 'CubeIcon',
  in_transit: 'TruckIcon',
  delivered: 'CheckBadgeIcon',
  cancelled: 'XCircleIcon',
  payment_failed: 'ExclamationTriangleIcon',
  refunded: 'ArrowUturnLeftIcon',
};

type Props = {
  progress: OrderProgress;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  trackingNumber?: string | null;
  /** Texto de la nota de email, o null si no corresponde decir nada. */
  emailNote: string | null;
};

export default function OrderStatusHero({
  progress,
  orderNumber,
  orderDate,
  paymentMethod,
  trackingNumber,
  emailNote,
}: Props) {
  const m = orderTrackingMessages;
  const t = TONE[progress.tone];
  const method = progress.isPickup ? 'pickup' : 'delivery';

  const copy =
    progress.kind === 'awaiting_payment'
      ? m.states.awaiting_payment[paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'mercadopago'][method]
      : m.states[progress.kind][method];

  const icon = progress.kind === 'ready' && progress.isPickup ? 'BuildingStorefrontIcon' : ICON[progress.kind];

  // El tracking sólo tiene sentido en envíos y mientras el pedido sigue vivo.
  const showTracking =
    !!trackingNumber && !progress.isPickup && progress.kind !== 'cancelled' && progress.kind !== 'refunded';

  // Transferencia pendiente: la acción que destraba el pedido es mandar el
  // comprobante. Va en el hero porque es LO que el cliente tiene que hacer.
  const askForReceipt = progress.kind === 'awaiting_payment' && paymentMethod === 'bank_transfer';
  const receiptUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola! Te mando el comprobante de la transferencia de mi pedido ${orderNumber}.`
  )}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      {/* Filete de estado: el mismo recurso que abre los mails. */}
      <div className={`h-1 ${t.bar}`} aria-hidden />

      <div className="p-5 sm:p-8">
        {/* En mobile el número y la fecha van en dos líneas: juntos cortaban la fecha a la mitad. */}
        <p className="flex flex-col text-xs text-muted-foreground sm:flex-row sm:gap-1 sm:text-sm">
          <span className="font-medium text-foreground">
            {m.meta.orderLabel} {orderNumber}
          </span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>
            {m.meta.placedOn} {orderDate}
          </span>
        </p>

        {/* En mobile el ícono va arriba: al costado le robaba ancho al titular y lo partía en dos líneas. */}
        <div className="mt-5 flex flex-col items-start gap-3 sm:mt-4 sm:flex-row sm:gap-4">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11 ${t.soft}`}>
            <Icon name={icon} size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
              {copy.title}
            </h1>
            <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {copy.subtitle}
            </p>
          </div>
        </div>

        {progress.steps && (
          <div className="mt-8">
            <ProgressStepper progress={progress} />
          </div>
        )}

        {showTracking && (
          <div className="mt-8 rounded-xl bg-muted p-4">
            {/* flex-wrap: en mobile el botón de DAC baja a su propia línea a lo
                ancho; en desktop queda en la misma fila que el número. */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {m.tracking.label(CARRIER_NAME)}
                </p>
                <p className="mt-0.5 truncate font-mono text-lg text-foreground">{trackingNumber}</p>
              </div>
              <CopyButton value={trackingNumber!} label={m.tracking.copy} copiedLabel={m.tracking.copied} />
              {/* El historial vive en DAC (detrás de reCAPTCHA): se linkea, no se replica. */}
              <a
                href={carrierTrackingUrl(trackingNumber!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-transform duration-150 ease-out hover:bg-red-700 active:scale-[0.97] sm:w-auto"
              >
                <Icon name="TruckIcon" size={18} className="text-white" />
                {m.tracking.open(CARRIER_NAME)}
                <Icon name="ArrowTopRightOnSquareIcon" size={14} className="text-white/80" />
              </a>
            </div>
          </div>
        )}

        {askForReceipt && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={18} className="text-green-500" />
            {m.help.sendReceipt}
          </a>
        )}

        {emailNote && (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="EnvelopeIcon" size={16} className="shrink-0" />
            <span className="min-w-0 break-words">{emailNote}</span>
          </p>
        )}
      </div>
    </section>
  );
}

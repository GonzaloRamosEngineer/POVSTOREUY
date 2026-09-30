// src/lib/orders/orderProgress.ts
//
// Traduce (payment_status, order_status, delivery_method) en lo que el
// cliente necesita ver en la página de seguimiento: en qué etapa está su
// pedido y qué tono tiene esa etapa.
//
// Existe porque la página vieja ignoraba order_status: mostraba siempre
// "¡Pedido Confirmado! Tu pedido está siendo preparado" — incluso a un
// pedido que ya iba en camino con número de seguimiento.
//
// Pura y sin React: se testea en orderProgress.test.ts.

export type ProgressKind =
  | 'awaiting_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded';

/** Color semántico de la etapa. `progress` usa el rojo de marca. */
export type ProgressTone = 'progress' | 'success' | 'warning' | 'danger' | 'neutral';

export type ProgressStepKey = 'payment' | 'confirmed' | 'preparing' | 'handoff' | 'done';

export type OrderProgress = {
  kind: ProgressKind;
  tone: ProgressTone;
  /**
   * Etapas del recorrido. `null` en estados terminales fuera del camino
   * feliz (cancelado, pago rechazado, reintegrado): ahí una barra de
   * progreso a medio llenar confundiría más de lo que informa.
   */
  steps: ProgressStepKey[] | null;
  /** Índice de la etapa actual dentro de `steps` (las anteriores ya se cumplieron). */
  current: number;
  isPickup: boolean;
};

type ProgressInput = {
  paymentStatus: string | null | undefined;
  orderStatus: string | null | undefined;
  isPickup: boolean;
};

const STEPS_PAID: ProgressStepKey[] = ['confirmed', 'preparing', 'handoff', 'done'];
const STEPS_UNPAID: ProgressStepKey[] = ['payment', 'preparing', 'handoff', 'done'];

export function getOrderProgress({ paymentStatus, orderStatus, isPickup }: ProgressInput): OrderProgress {
  const base = { isPickup };

  // Los terminales van primero: una orden cancelada no "está en camino"
  // aunque algún campo haya quedado desfasado.
  if (orderStatus === 'cancelled') {
    return { ...base, kind: 'cancelled', tone: 'neutral', steps: null, current: 0 };
  }
  if (paymentStatus === 'refunded') {
    return { ...base, kind: 'refunded', tone: 'neutral', steps: null, current: 0 };
  }
  if (paymentStatus === 'failed') {
    return { ...base, kind: 'payment_failed', tone: 'danger', steps: null, current: 0 };
  }
  if (paymentStatus !== 'completed') {
    return { ...base, kind: 'awaiting_payment', tone: 'warning', steps: STEPS_UNPAID, current: 0 };
  }

  switch (orderStatus) {
    case 'completed':
      return { ...base, kind: 'delivered', tone: 'success', steps: STEPS_PAID, current: 3 };

    case 'shipped':
      // El admin no deja despachar un retiro; si llegara a pasar, para el
      // cliente lo correcto es "listo para retirar", no "en camino".
      return isPickup
        ? { ...base, kind: 'ready', tone: 'progress', steps: STEPS_PAID, current: 2 }
        : { ...base, kind: 'in_transit', tone: 'progress', steps: STEPS_PAID, current: 2 };

    case 'ready':
      // Retiro: "listo" ES la etapa de entrega al cliente.
      // Envío: está armado pero todavía no salió → sigue en preparación.
      return {
        ...base,
        kind: 'ready',
        tone: 'progress',
        steps: STEPS_PAID,
        current: isPickup ? 2 : 1,
      };

    case 'processing':
      return { ...base, kind: 'preparing', tone: 'progress', steps: STEPS_PAID, current: 1 };

    default:
      // 'pending' con el pago acreditado: compra confirmada, nadie la tocó aún.
      return { ...base, kind: 'confirmed', tone: 'progress', steps: STEPS_PAID, current: 0 };
  }
}

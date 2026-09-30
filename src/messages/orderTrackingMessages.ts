// src/messages/orderTrackingMessages.ts
//
// Copy de la página de pedido (/order-confirmation), que es a la vez la
// confirmación post-checkout y la pantalla de seguimiento.
//
// Regla: cada texto describe el estado REAL del pedido. Nada de promesas
// genéricas ("te enviamos un mail", "creá tu cuenta") que no se cumplen.

import type { ProgressKind, ProgressStepKey } from '@/lib/orders/orderProgress';

type Variant = { title: string; subtitle: string };
type ByMethod = { delivery: Variant; pickup: Variant };

const same = (v: Variant): ByMethod => ({ delivery: v, pickup: v });

export const orderTrackingMessages = {
  meta: {
    orderLabel: 'Pedido',
    placedOn: 'Realizado el',
  },

  states: {
    awaiting_payment: {
      mercadopago: same({
        title: 'Estamos esperando tu pago',
        subtitle: 'MercadoPago todavía está procesando el pago. Apenas se acredite, confirmamos tu pedido.',
      }),
      bank_transfer: same({
        title: 'Estamos esperando tu transferencia',
        subtitle:
          'Cuando se acredite, confirmamos tu pedido. Si ya transferiste, mandanos el comprobante por WhatsApp y lo agilizamos.',
      }),
    },
    confirmed: same({
      title: '¡Gracias por tu compra!',
      subtitle: 'Recibimos tu pago y tu pedido quedó confirmado. En breve empezamos a prepararlo.',
    }),
    preparing: {
      delivery: {
        title: 'Estamos preparando tu pedido',
        subtitle: 'Cuando lo despachemos, vas a ver acá el número de seguimiento.',
      },
      pickup: {
        title: 'Estamos preparando tu pedido',
        subtitle: 'Te avisamos apenas esté listo para que pases a retirarlo.',
      },
    },
    ready: {
      delivery: {
        title: 'Tu pedido está listo para salir',
        subtitle: 'Ya está armado y listo para despachar. Cuando salga, vas a ver acá el número de seguimiento.',
      },
      pickup: {
        title: '¡Tu pedido está listo para retirar!',
        subtitle: 'Podés pasar a buscarlo por el local.',
      },
    },
    in_transit: same({
      title: 'Tu pedido está en camino',
      subtitle: 'La entrega estimada es de 24 a 72 horas hábiles.',
    }),
    delivered: {
      delivery: {
        title: 'Tu pedido fue entregado',
        subtitle: '¡Que lo disfrutes! Si algo no está como esperabas, escribinos.',
      },
      pickup: {
        title: 'Retiraste tu pedido',
        subtitle: '¡Que lo disfrutes! Si algo no está como esperabas, escribinos.',
      },
    },
    cancelled: same({
      title: 'Este pedido fue cancelado',
      subtitle: 'Si no esperabas esto o tenés alguna duda, escribinos y lo revisamos.',
    }),
    payment_failed: same({
      title: 'No pudimos confirmar tu pago',
      subtitle:
        'El pago no se acreditó. Si igual ves el débito en tu cuenta, escribinos y lo revisamos.',
    }),
    refunded: same({
      title: 'Reintegramos tu pago',
      subtitle: 'El importe se devolvió al medio de pago que usaste.',
    }),
  } satisfies Record<Exclude<ProgressKind, 'awaiting_payment'>, ByMethod> & {
    awaiting_payment: { mercadopago: ByMethod; bank_transfer: ByMethod };
  },

  steps: {
    payment: { delivery: 'Pago', pickup: 'Pago' },
    confirmed: { delivery: 'Confirmado', pickup: 'Confirmado' },
    preparing: { delivery: 'En preparación', pickup: 'En preparación' },
    handoff: { delivery: 'En camino', pickup: 'Listo para retirar' },
    done: { delivery: 'Entregado', pickup: 'Retirado' },
  } satisfies Record<ProgressStepKey, { delivery: string; pickup: string }>,

  tracking: {
    label: 'Número de seguimiento',
    copy: 'Copiar',
    copied: 'Copiado',
    hint: 'Usalo en la web del correo para ver el recorrido del envío.',
  },

  emailNote: {
    sent: (email: string) => `Te enviamos la confirmación a ${email}`,
    willSend: (email: string) => `Te vamos a avisar por email a ${email}`,
  },

  items: {
    title: 'Tu compra',
    count: (n: number) => (n === 1 ? '1 producto' : `${n} productos`),
    includes: 'Incluye',
    quantity: (n: number) => `Cantidad: ${n}`,
    subtotal: 'Subtotal',
    shipping: 'Envío',
    shippingFree: 'Gratis',
    total: 'Total',
  },

  delivery: {
    title: 'Entrega',
    delivery: 'Envío a domicilio',
    pickup: 'Retiro en el local',
    recipient: 'Recibe',
    estimate: 'Entrega estimada: 24 a 72 horas hábiles',
    pickupHowTo: 'Coordinamos el día y horario por WhatsApp.',
    directions: 'Cómo llegar',
  },

  payment: {
    title: 'Pago',
    methods: {
      mercadopago: 'MercadoPago',
      bank_transfer: 'Transferencia bancaria',
    } as Record<string, string>,
    status: {
      completed: 'Acreditado',
      pending: 'Pendiente',
      failed: 'Rechazado',
      refunded: 'Reintegrado',
    } as Record<string, string>,
    transactionId: 'ID de operación',
  },

  help: {
    title: '¿Necesitás ayuda con tu pedido?',
    body: 'Escribinos por WhatsApp con tu número de pedido y te respondemos.',
    whatsapp: 'Escribinos por WhatsApp',
    sendReceipt: 'Enviar comprobante por WhatsApp',
    whatsappMessage: (orderNumber: string) => `Hola! Te escribo por mi pedido ${orderNumber}.`,
    email: 'O por email a',
  },

  // Mismas tres promesas que el sitio muestra en la franja de la home.
  // No sumar garantías nuevas acá sin que existan en el sitio.
  trust: [
    { icon: 'TruckIcon', label: 'Envíos a todo el país' },
    { icon: 'ShieldCheckIcon', label: 'Garantía oficial' },
    { icon: 'LockClosedIcon', label: 'Pagos seguros' },
  ],

  actions: {
    keepShopping: 'Seguir comprando',
    print: 'Imprimir',
  },

  errors: {
    title: 'No pudimos mostrar tu pedido',
    body: 'El enlace puede estar incompleto. Buscalo con tu número de pedido y tu email.',
    lookup: 'Buscar mi pedido',
    home: 'Ir a la tienda',
  },
} as const;

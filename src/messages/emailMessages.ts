// src/messages/emailMessages.ts
//
// Copy centralizado de los mails transaccionales al cliente.
// Misma convención que el resto de src/messages: NO hardcodear strings en
// los templates ni en los route handlers.
//
// Voseo rioplatense, igual que orderMessages (cara visible al cliente).

export const SENDER_NAME = 'POV Store';
export const SENDER_EMAIL = 'info@povstore.uy';
export const SUPPORT_EMAIL = 'info@povstore.uy';
export const SITE_LABEL = 'povstore.uy';

export const emailMessages = {
  common: {
    greeting: (name?: string | null) =>
      name ? `Hola ${name.split(' ')[0]}:` : 'Hola:',
    orderLabel: (orderNumber: string) => `Pedido: ${orderNumber}`,
    includesLabel: 'Incluye:',
    totalLabel: 'Total',
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Envío',
    shippingFree: 'Sin costo',
    signature: 'Equipo POV Store',
    footerContact: `${SUPPORT_EMAIL} · ${SITE_LABEL}`,
    footerReply: 'Si necesitás cambiar algún dato, respondé este correo y lo resolvemos.',
  },

  confirmed: {
    subject: (orderNumber: string) => `Confirmamos tu compra — pedido ${orderNumber}`,
    preheader: 'Recibimos tu pago. Tu pedido quedó confirmado.',
    title: '¡Gracias por tu compra!',
    body: 'Recibimos tu pago y tu pedido quedó confirmado. Esto es lo que compraste:',
    nextStepDelivery:
      'Ya lo estamos preparando. Cuando lo despachemos te enviamos el número de seguimiento por este mismo medio.',
    nextStepPickup:
      'Ya lo estamos preparando. Te avisamos por este medio apenas esté listo para que pases a retirarlo.',
  },

  processing: {
    subject: (orderNumber: string) => `Tu pedido ${orderNumber} ya está en preparación`,
    preheader: 'Recibimos tu pedido y lo estamos preparando.',
    title: 'Tu pedido está en preparación',
    body: 'Gracias por tu compra en POV Store. Ya recibimos tu pedido y está en preparación.',
    nextStepDelivery:
      'En breve lo despachamos y por este mismo medio te enviamos el número de seguimiento para que puedas ver el estado del envío.',
    nextStepPickup:
      'Apenas esté listo te avisamos por este medio para que pases a retirarlo.',
  },

  shipped: {
    subject: (orderNumber: string) => `Tu pedido ${orderNumber} fue despachado`,
    preheader: 'Tu pedido salió. Acá va el número de seguimiento.',
    title: 'Tu pedido va en camino',
    body: 'Ya despachamos tu pedido. Podés seguirlo con este número:',
    trackingLabel: 'Número de seguimiento',
    estimate: 'La entrega estimada es de 24 a 72 horas hábiles.',
  },

  ready: {
    subject: (orderNumber: string) => `Tu pedido ${orderNumber} está listo para retirar`,
    preheader: 'Podés pasar a retirar tu pedido.',
    title: 'Tu pedido está listo',
    body: 'Tu pedido ya está armado y te espera en el local:',
    addressLabel: 'Dirección de retiro',
  },
} as const;

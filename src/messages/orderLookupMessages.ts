// src/messages/orderLookupMessages.ts
//
// Copy del seguimiento público de pedidos (/seguimiento) y su endpoint.
// Cara al cliente: voseo, igual que orderTrackingMessages.

export const orderLookupMessages = {
  page: {
    title: 'Seguí tu pedido',
    subtitle:
      'Ingresá el número de pedido y el email con el que comprás y te mostramos en qué estado está.',
    orderNumberLabel: 'Número de pedido',
    orderNumberPlaceholder: 'POV-123456',
    orderNumberHelp: 'Lo encontrás en el asunto de los correos que te enviamos.',
    emailLabel: 'Email de la compra',
    emailPlaceholder: 'tu@email.com',
    submit: 'Ver mi pedido',
    submitting: 'Buscando...',
    helpTitle: '¿No encontrás tu pedido?',
    helpBody:
      'Revisá que el email sea el mismo que usaste al comprar. Si seguís sin encontrarlo, escribinos y lo buscamos por vos.',
    helpCta: 'Escribinos por WhatsApp',
  },

  errors: {
    // Mismo mensaje para "no existe" y "no coinciden": no confirmamos la
    // existencia de un pedido a quien no puede probar que es suyo.
    notFound:
      'No encontramos un pedido con esos datos. Revisá el número y el email con el que compraste.',
    missingFields: 'Completá el número de pedido y el email.',
    invalidEmail: 'Revisá el email: no parece una dirección válida.',
    serverError: 'No pudimos consultar tu pedido en este momento. Probá de nuevo en un minuto.',
  },
} as const;

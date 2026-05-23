// src/messages/apiErrorMessages.ts

export const apiErrorMessages = {
  createOrder: {
    // Errores de Validación (Helpers)
    validation: {
      quantity: 'Cada producto debe incluir una cantidad válida.',
      missingProductId: 'Producto inválido: falta el identificador.',
      missingPackIds: 'Combo inválido: faltan los identificadores.',
      invalidShape: 'El formato del artículo no es reconocido.',
      packInvalid: 'Los datos del combo son inválidos.',
      packNoComponents: 'El combo no tiene componentes válidos.',
      packInvalidProductId: 'Un componente del combo no es válido.',
      packInvalidRole: 'Un componente del combo tiene un rol no válido.',
      packInvalidQuantity: 'Un componente del combo tiene una cantidad no válida.',
      packMultiplePrimary: 'El combo debe tener exactamente un producto principal.',
    },
    // Errores de la Ruta Principal
    missingIdempotency: 'Falta la clave de seguridad de la transacción o es inválida.',
    missingCustomerOrItems: 'Faltan los datos del cliente o los productos del carrito.',
    missingField: (field: string) => `Falta información obligatoria: ${field}`,
    invalidDepartment: (dept: string) => `El departamento ingresado no es válido: ${dept}`,
    invalidPaymentMethod: 'El método de pago seleccionado no es válido.',
    idempotencyConflict: 'Esta transacción ya fue procesada previamente.',
    idempotencyCheckFailed: 'Error al verificar la seguridad de la transacción.',
    productsLoadFailed: 'Ocurrió un error al consultar los productos disponibles.',
    productNotFound: 'No se encontró uno de los productos solicitados.',
    productInactive: (name: string) => `El producto "${name}" ya no está disponible.`,
    packNotFound: 'No se encontró la promoción solicitada.',
    invalidPack: 'La configuración de la promoción no es válida.',
    packComponentNotFound: 'No se encontró un artículo de la promoción.',
    packComponentInactive: (name: string) => `El artículo "${name}" de la promoción no está disponible.`,
    packComponentsLoadFailed: 'Ocurrió un error al cargar los artículos de la promoción.',
    notEnoughStock: (name: string) => `No hay stock suficiente para: ${name}. Revisa las cantidades.`,
    idempotencyResolveFailed: 'Error al resolver el estado de la transacción.',
    priceDriftRejected: 'Los precios cambiaron desde que armaste el carrito. Revisá el nuevo total antes de continuar.',
    orderCreationFailed: 'Ocurrió un error al registrar tu pedido. Por favor, intentá nuevamente.',
    orderItemsCreationFailed: 'Ocurrió un error al guardar los productos de tu pedido.',
    unexpected: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor, intentá más tarde.',
  },
  // 👇 NUEVA SECCIÓN PARA LA GENERACIÓN DEL LINK DE PAGO 👇
  mpPreference: {
    missingToken: 'Falta la configuración de MercadoPago (MP_ACCESS_TOKEN).',
    missingOrderId: 'Falta el identificador de la orden.',
    orderNotFound: 'No se encontró la orden solicitada.',
    orderAlreadyPaid: 'La orden ya está pagada. No se puede generar un nuevo link de pago.',
    orderCancelled: 'La orden está cancelada. No se puede generar un link de pago.',
    orderRefunded: 'La orden ya fue reembolsada. No se puede generar un nuevo link de pago.',
    itemsLoadFailed: 'Error al cargar los artículos de la orden.',
    noItems: 'La orden no tiene artículos.',
    noCommercialItems: 'La orden no contiene artículos válidos para cobrar con MercadoPago.',
    unexpected: 'Error inesperado al generar el link de pago.',
    // Textos internos que se envían a MercadoPago
    shippingItemTitle: 'Costo de envío',
    defaultClientName: 'Cliente',
    defaultClientEmail: 'test_user_123@test.com',
    statementDescriptor: 'POV STORE UY'
  },
  // 👇 NUEVA SECCIÓN PARA EL WEBHOOK (Comunicación silenciosa con MP) 👇
  mpWebhook: {
    missingToken: 'Falta la configuración de MercadoPago (MP_ACCESS_TOKEN).',
    missingWebhookSecret: 'Falta la configuración del webhook de MercadoPago (MP_WEBHOOK_SECRET).',
    invalidSignature: (reason: string) => `Firma de webhook inválida: ${reason}`,
    invalidTransition: (current: string, target: string) => `Transición de estado inválida: de '${current}' a '${target}'`,
    stockApplyFailed: (reason: string) => `Error al aplicar stock: ${reason}`,
    dbUpdateFailed: 'Fallo transitorio al actualizar la orden. MP reintentará.',
    unhandledException: 'Error inesperado en el webhook. MP reintentará.'
  }
};
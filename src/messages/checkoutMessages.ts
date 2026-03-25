// src/messages/checkoutMessages.ts

export const checkoutMessages = {
  header: {
    title: 'Finalizar Compra',
    subtitle: 'Completa tu información y elige tu método de pago preferido',
  },
  emptyCart: {
    title: 'Tu carrito está vacío',
    description: 'Agregá productos antes de finalizar la compra.',
    button: 'Volver a la tienda',
  },
  paymentMethods: {
    mercadopago: {
      name: 'MercadoPago',
      description: 'Pago seguro con checkout de MercadoPago',
      badge: 'Recomendado',
    },
    transfer: {
      name: 'Transferencia Bancaria',
      description: 'Pago directo desde tu banco - Procesamiento en 24-48hs',
    },
  },
  errors: {
    incompleteDataMp: 'Completá tus datos de contacto antes de pagar.',
    incompleteDataTransfer: 'Completá tus datos de contacto antes de confirmar.',
    mercadoPagoInit: 'Error al iniciar pago con MercadoPago',
    transferInit: 'Error al crear pedido por transferencia',
  },
  whatsapp: {
    template: (orderNumber: string) => 
      `¡Hola POV Store! Quiero finalizar mi compra #${orderNumber} por Transferencia Bancaria para acceder al descuento del 5%.`
  },
  customerForm: {
    sections: {
      contact: 'Información de Contacto',
      deliveryMethod: '¿Cómo deseas recibir tu pedido?',
      shippingData: 'Datos del Envío',
    },
    labels: {
      email: 'Email',
      fullName: 'Nombre Completo',
      phone: 'Teléfono',
      delivery: 'Envío a Domicilio',
      pickup: 'Retiro en Local',
      address: 'Dirección',
      city: 'Ciudad',
      department: 'Departamento',
      postalCode: 'Código Postal',
    },
    placeholders: {
      email: 'tu@email.com',
      fullName: 'Juan Pérez',
      phone: '099 123 456',
      address: 'Av. 18 de Julio 1234, Apto 501',
      city: 'Montevideo',
      postalCode: '11000',
    },
    validation: {
      emailRequired: 'Email requerido',
      emailInvalid: 'Email inválido',
      nameRequired: 'Nombre completo requerido',
      phoneInvalid: 'Teléfono inválido',
      addressRequired: 'Dirección requerida',
      cityRequired: 'Ciudad requerida',
    },
    pickup: {
      title: 'Dirección de retiro',
      description: 'Te contactaremos por WhatsApp/Email cuando tu pedido esté listo para retirar.',
    },
    guestInfo: {
      title: 'Compra Rápida:',
      description: 'No necesitas crear cuenta. Te enviaremos el seguimiento a tu email.',
    }
  },
  // 👇 NUEVAS SECCIONES DE MÉTODOS DE PAGO 👇
  mercadoPagoForm: {
    securePaymentTitle: 'Pago Seguro con MercadoPago',
    securePaymentDesc: 'Serás redirigido al checkout oficial de MercadoPago',
    processing: 'Iniciando pago...',
    payButton: 'Pagar con MercadoPago',
    acceptedCardsLabel: 'Aceptamos:',
    cards: ['Visa', 'Mastercard', 'OCA']
  },
  bankTransferForm: {
    benefitTitle: '¡Beneficio Pago Directo!',
    benefitDesc: 'Al pagar por transferencia bancaria directa, te ahorrás las comisiones y te regalamos un descuento especial.',
    discountApplied: '5% DE DESCUENTO APLICADO',
    explanationPrefix: 'Para aplicar el descuento correctamente y verificar el stock inmediato, ',
    explanationBold: 'un asesor procesará tu pedido manualmente por WhatsApp.',
    processing: 'Registrando pedido...',
    payButton: 'Finalizar compra por WhatsApp',
    referenceLabel: 'Referencia de pedido:'
  }
};
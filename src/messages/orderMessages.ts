// src/messages/orderMessages.ts

export const orderMessages = {
  confirmation: {
    loading: 'Cargando tu orden...',
    errors: {
      missingOrderId: 'Falta orderId en la URL. Volvé al carrito e intentá nuevamente.',
      fetchFailed: 'No se pudo cargar la orden',
      generic: 'Error al cargar la confirmación',
      notFoundTitle: 'Ups…',
      notFoundDesc: 'No pudimos mostrar la confirmación.',
    },
    states: {
      completed: {
        title: '¡Pedido Confirmado!',
        subtitlePickup: 'Gracias por tu compra. Tu pedido quedó confirmado para retiro en local.',
        subtitleDelivery: 'Gracias por tu compra. Tu pedido está siendo preparado para el envío.',
      },
      pending: {
        title: 'Pedido en proceso',
        subtitle: 'Tu pago está pendiente. Apenas se acredite, te avisamos.',
        desc: 'Tu pago está pendiente. Si ya pagaste, puede demorar unos minutos en reflejarse.',
      },
      failed: {
        title: 'Pago no confirmado',
        subtitle: 'El pago no se acreditó. Podés reintentar o cambiar el método de pago.',
        desc: 'El pago no se acreditó. Podés reintentar el pago o cambiar el método.',
      }
    },
    deliveryInfo: {
      methodPickup: 'Retiro en Local Físico',
      methodDelivery: 'Envío a domicilio',
      estimatePickup: 'Coordinaremos por WhatsApp / Email',
      estimateDelivery: '24-72 hs hábiles (estimado)',
    },
    buttons: {
      backToCart: 'Volver al carrito',
      goHome: 'Ir al inicio',
      print: 'Imprimir Confirmación',
      contactSupport: 'Contactar Soporte',
    },
    footerHelp: '¿Tenés alguna pregunta sobre tu pedido?'
  },
  // 👇 NUEVA SECCIÓN PARA LA TARJETA DE ESTADO 👇
  paymentStatusCard: {
    title: 'Estado del Pago',
    status: {
      completed: {
        text: 'Pago Completado',
        desc: 'Tu pago ha sido procesado exitosamente',
      },
      pending: {
        text: 'Pago Pendiente',
        desc: 'Esperando confirmación del pago',
      },
      failed: {
        text: 'Pago Fallido',
        desc: 'Hubo un problema con tu pago',
      },
    },
    labels: {
      transactionId: 'ID de Transacción',
      paymentMethod: 'Método de Pago',
      referenceNumber: 'Número de Referencia',
    }
  }
};
// src/messages/adminOrderMessages.ts

export const adminOrderMessages = {
  modal: {
    title: 'Panel de Gestión',
    close: 'Cerrar',
    whatsapp: 'WhatsApp Cliente',
    badges: {
      pickup: 'Retiro en Local',
      cancelled: 'Cancelado',
    }
  },
  items: {
    title: 'Artículos del Pedido',
    packGroup: 'PACK GROUP',
    labels: {
      packPrimary: 'PACK PRIMARY',
      packComponent: 'PACK COMPONENT',
      simple: 'SIMPLE',
      commercialLine: 'Línea comercial del pack',
      internalLine: 'Línea interna de composición',
      qty: 'CANTIDAD',
      unit: 'UNIT',
      packId: 'Pack ID:',
      packGroup: 'Pack Group:',
      packParent: 'Pack Parent Product:',
      packVersion: 'Pack Version:'
    }
  },
  payment: {
    transfer: {
      title: 'Gestión de Pago (Transferencia)',
      markPaid: 'Marcar como Pagado',
      revertPending: 'Revertir a Pendiente',
      verifyWarning: 'Confirma el pago una vez verificada la transferencia bancaria.',
    },
    mercadoPago: {
      title: 'Información MercadoPago',
      paymentId: 'Payment ID',
      mpStatus: 'Estado MP',
      mpDetail: 'Detalle MP',
      preferenceId: 'Preference ID',
      paymentLink: 'Link de Pago',
      pendingWarning: 'Este pago está pendiente en MercadoPago. Puedes cancelarlo si el cliente no completa el pago.',
      cancelBtn: 'Cancelar Pago MercadoPago',
      cancelConfirm: '⚠️ Esto cancelará el pago en MercadoPago y la orden. ¿Continuar?',
    },
    cancelOrder: {
      title: 'Cancelar Orden',
      warning: 'Esta acción cancelará la orden y marcará el pago como fallido. Solo disponible para transferencias bancarias.',
      cancelBtn: 'Cancelar Esta Orden',
      confirmWarning: '⚠️ ¿Estás seguro? Esta acción no se puede deshacer.',
    },
    shared: {
      noBack: 'No, volver',
      yesCancel: 'Sí, Cancelar',
    },
    statusDisplay: {
      paid: 'PAGADO',
      failed: 'FALLIDO',
      pending: 'PENDIENTE',
      capitalized: {
        paid: 'Pagado',
        failed: 'Fallido',
        pending: 'Pendiente'
      }
    }
  },
  fulfillment: {
    pickupTitle: 'Flujo de Retiro',
    shippingTitle: 'Flujo de Envío',
    backTo: 'Volver a',
    processOrder: 'Procesar Pedido',
    readyPickup: 'Listo para Retiro',
    readyShipping: 'Listo para Envío',
    confirmPickup: 'Confirmar Retiro',
    trackingPlaceholder: 'Nro Tracking (UES, Mirtrans...)',
    dispatch: 'Despachar',
    confirmDelivery: 'Confirmar Entrega',
    currentFlow: 'Flujo actual:',
  },
  cancelledState: {
    title: 'Orden Cancelada',
    desc: 'Esta orden ha sido cancelada y no se puede procesar.'
  },
  summary: {
    total: 'Total Pedido',
    paymentStatus: 'Estado del Pago',
    buyer: 'Comprador',
    pickupLabel: 'Retiro en Local',
    shippingLabel: 'Envío',
    pickupDesc: 'El cliente retira en local',
    tracking: 'Tracking',
  },
  toasts: {
    paymentUpdateSuccess: 'Estado de pago actualizado',
    paymentUpdateError: 'Error al actualizar estado de pago',
    orderCancelSuccess: 'Orden cancelada exitosamente',
    orderCancelError: 'Error al cancelar la orden',
    mpCancelSuccess: 'Pago de MercadoPago cancelado exitosamente',
    mpCancelError: 'Error al cancelar el pago de MercadoPago',
    orderUpdateSuccess: 'Orden actualizada',
    orderUpdateError: 'Error al actualizar',
  },
  mpStatuses: {
    approved: 'Aprobado',
    pending: 'Pendiente',
    authorized: 'Autorizado',
    in_process: 'En Proceso',
    in_mediation: 'En Mediación',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    charged_back: 'Contracargo',
    notAvailable: 'N/A'
  }
};
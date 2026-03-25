// src/messages/adminOrderApiMessages.ts

export const adminOrderApiMessages = {
  get: {
    notFound: 'La orden no existe en la base de datos',
    serverError: 'Error interno del servidor',
  },
  patch: {
    notFound: 'Orden no encontrada',
    invalidStatus: (status: string) => `Estado de pedido inválido: ${status}`,
    pickupShippedError: 'Los pedidos de retiro en local no pueden pasar a estado "shipped"',
    shippingRequiresTracking: 'Se requiere número de tracking para despachar un envío',
    mpConfigMissing: 'Configuración de MercadoPago no disponible. Verifica las variables de entorno.',
    mpCancelError: (msg: string) => `Error al cancelar en MercadoPago: ${msg}`,
    mpCommunicationError: 'Error al comunicarse con MercadoPago',
    pickupTrackingError: 'No se puede asignar tracking a un pedido de retiro en local',
    invalidPaymentStatus: (status: string) => `Estado de pago inválido: ${status}`,
    manualConfirmBankOnly: 'La confirmación manual de pago aplica solo a transferencias bancarias',
    invalidPaymentTransition: (status: string) => `Transición inválida: no se puede confirmar pago desde el estado '${status}'`,
    stockApplyError: 'Error al aplicar descuento de stock',
    serverError: 'Error al actualizar la orden',
  }
};
// src/messages/adminProductsApiMessages.ts

export const adminProductsApiMessages = {
  auth: {
    missingToken: 'Token de acceso no proporcionado.',
    invalidToken: 'Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.',
    adminRequired: 'Se requieren permisos de administrador para realizar esta acción.',
  },
  validation: {
    invalidJson: 'El formato de los datos enviados es inválido (JSON error).',
    missingId: 'El parámetro ID es obligatorio.',
    packValidateError: 'Error al validar los productos que componen el pack.',
    packComponentNotFound: 'Uno de los productos incluidos en el pack no existe en la base de datos.',
    packComponentInactive: 'Uno de los productos incluidos en el pack se encuentra inactivo.',
    invalidPacksArray: 'Formato de packs inválido: se esperaba una lista (array).',
    invalidPackContract: 'La configuración de los packs contiene errores.',
  },
  responses: {
    notFound: 'El producto solicitado no fue encontrado.',
    serverError: 'Error interno del servidor al procesar el producto.',
  }
};
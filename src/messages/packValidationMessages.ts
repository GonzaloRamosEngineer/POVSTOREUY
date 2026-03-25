// src/messages/packValidationMessages.ts

export const packValidationMessages = {
  PACK_INVALID_SHAPE: 'El pack debe ser un objeto válido.',
  PACK_MISSING_ID: 'El ID del pack es obligatorio.',
  PACK_COMPONENTS_REQUIRED: 'El pack debe contener al menos un componente.',
  PACK_COMPONENT_INVALID_SHAPE: 'El componente del pack debe ser un objeto válido.',
  PACK_COMPONENT_INVALID_PRODUCT_ID: 'El identificador del producto (product_id) no es válido.',
  PACK_COMPONENT_INVALID_QUANTITY: 'La cantidad del componente debe ser un número entero mayor a 0.',
  PACK_COMPONENT_INVALID_ROLE: 'El rol del componente debe ser "primary" o "component".',
  PACK_PRIMARY_COUNT_INVALID: 'El pack debe contener exactamente un componente principal (primary).',
  PACK_VERSION_INVALID: 'La versión del pack debe ser un número entero mayor o igual a 1.',
};
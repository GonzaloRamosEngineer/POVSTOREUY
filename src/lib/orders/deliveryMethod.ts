// src/lib/orders/deliveryMethod.ts
//
// Tipo + helpers para razonar sobre el método de envío de una orden.
// Reemplaza el patrón histórico `!shipping_address` que estaba hardcodeado
// en 9 sitios — ese patrón fallaba si shipping_address quedaba vacío por
// bug sin que la orden fuera realmente pickup (ver PF-09).
//
// La fuente de verdad es la columna `orders.delivery_method` (ENUM en
// Postgres). Helpers tolerantes a `null/undefined` por compatibilidad con
// row shapes parciales (algunos componentes definen interfaces locales
// que no incluyen el campo todavía durante refactors).

export type DeliveryMethod = 'delivery' | 'pickup';

/**
 * Dirección física única del punto de retiro (server-side y client-side la
 * referencian para mostrar al usuario). Fuente de verdad: este módulo —
 * antes vivía duplicada en create-order/route.ts y parseada de notes en
 * OrderConfirmationInteractive.
 */
export const PICKUP_ADDRESS =
  'José Enrique Rodó 2219, 11200 Montevideo, Departamento de Montevideo';

type OrderLike = { delivery_method?: DeliveryMethod | string | null };

/** True si la orden es de retiro en local. Tolera shapes sin la columna. */
export function isPickup(order: OrderLike | null | undefined): boolean {
  return order?.delivery_method === 'pickup';
}

/** True si la orden es de envío a domicilio. */
export function isDelivery(order: OrderLike | null | undefined): boolean {
  return order?.delivery_method === 'delivery';
}

/**
 * Meta (Facebook) Pixel — helpers client-side.
 *
 * El pixel base y el PageView inicial se inyectan en <MetaPixel /> (ver
 * src/components/analytics/MetaPixel.tsx). Este módulo centraliza el wrapper
 * tipado sobre `window.fbq` y los eventos de conversión.
 *
 * Fase 2 (documentada en CLAUDE.md): Conversions API server-side desde
 * mp-webhook. Cuando se implemente, reusar el mismo `eventId` (= order.id) que
 * `trackPurchase` para que Meta deduplique el evento pixel vs. server.
 * https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function isReady(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/** Dispara un PageView manual (usado en navegaciones client-side del App Router). */
export function pageview(): void {
  if (!isReady()) return;
  window.fbq!('track', 'PageView');
}

export interface PurchaseContent {
  /** Identificador del ítem (order_item id — ver limitación en trackPurchase). */
  id: string;
  quantity: number;
  item_price: number;
}

export interface PurchaseParams {
  /** Total real de la orden, en la moneda de `currency`. */
  value: number;
  /** ISO 4217, ej. 'UYU'. */
  currency: string;
  /** Número legible de orden (POV-XXXXXX) — va como `order_id` del evento. */
  orderNumber: string;
  /**
   * ID estable del evento para deduplicación pixel/CAPI. Usar order.id (uuid).
   * Debe coincidir con el `event_id` que enviará la Conversions API en fase 2.
   */
  eventId: string;
  numItems?: number;
  contents?: PurchaseContent[];
}

/**
 * Dispara el evento estándar `Purchase`.
 *
 * Limitación conocida: `contents[].id` hoy es el id de `order_items`, no el SKU
 * del catálogo de Meta. El valor de conversión (`value` + `currency`) —lo que
 * importa para optimizar por compra— es correcto. Si a futuro se sube un
 * catálogo a Meta, mapear a product_id/SKU para habilitar matching de catálogo.
 */
export function trackPurchase(params: PurchaseParams): void {
  if (!isReady()) return;

  window.fbq!(
    'track',
    'Purchase',
    {
      value: params.value,
      currency: params.currency,
      content_type: 'product',
      order_id: params.orderNumber,
      ...(params.numItems != null ? { num_items: params.numItems } : {}),
      ...(params.contents ? { contents: params.contents } : {}),
    },
    { eventID: params.eventId }
  );
}

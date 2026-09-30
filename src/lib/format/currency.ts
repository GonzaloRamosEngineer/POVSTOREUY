// src/lib/format/currency.ts
//
// Formato de moneda de cara al cliente (web y mails).
//
// Se muestra el código ISO `UYU` en vez del símbolo `$`: fuera del contexto
// del sitio (un mail, una captura que el cliente reenvía) el `$` solo es
// ambiguo — peso argentino, dólar. Mismo código que usan el pixel de Meta y
// el `currency_id` de MercadoPago.

export const STORE_CURRENCY = 'UYU';

export function formatUYU(amount: number): string {
  return `${STORE_CURRENCY} ${Math.round(amount).toLocaleString('es-UY')}`;
}

/**
 * Transportista de los envíos a domicilio. Fuente de verdad única.
 *
 * POV Store despacha SIEMPRE por DAC (confirmado 2026-09-29), así que el
 * transportista no se guarda por orden: el número de rastreo alcanza para
 * armar el link. Si algún día se suma otro correo, hay que guardar el
 * transportista en `orders` y elegir el link según ese dato — no asumir DAC.
 *
 * Por qué sólo un link y no el historial dentro del sitio: la consulta de DAC
 * está detrás de Google reCAPTCHA. Traer esos datos requeriría saltarse esa
 * protección. El camino correcto es pedirle a DAC acceso por API.
 */

export const CARRIER_NAME = 'DAC';

export function carrierTrackingUrl(trackingNumber: string): string {
  return `https://www.dac.com.uy/envios/rastreo/Codigo_Rastreo/${encodeURIComponent(trackingNumber.trim())}`;
}

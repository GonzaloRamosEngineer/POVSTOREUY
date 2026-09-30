/**
 * Datos de contacto de cara al cliente. Fuente de verdad única.
 *
 * Existía duplicado (y en parte inventado) en varios componentes: la tarjeta
 * de confirmación mostraba `soporte@povstoreuruguay.com` y un teléfono de
 * relleno, y el número de WhatsApp estaba hardcodeado en 3 archivos.
 * Si cambia un dato, se cambia acá.
 */

export const SUPPORT_EMAIL = 'info@povstore.uy';

/** Sólo dígitos, formato internacional — es lo que espera wa.me. */
export const WHATSAPP_NUMBER = '59896482949';

/** Versión legible del mismo número, para mostrar en pantalla. */
export const WHATSAPP_DISPLAY = '+598 96 482 949';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const SITE_DOMAIN = 'povstore.uy';

// src/lib/email/brand.ts
//
// Tokens de marca para los mails, espejados de src/styles/tailwind.css.
//
// Están duplicados a propósito: un mail no puede leer variables CSS ni clases
// de Tailwind, todo va inline. Si cambia la paleta del sitio, cambiar acá
// también — es el único lugar de los mails donde viven los colores.

/** --color-primary (Red 600). El rojo de la marca. */
export const BRAND_RED = '#DC2626';
/** --color-foreground (Zinc 950). Titulares y texto fuerte. */
export const INK = '#09090b';
/** Zinc 700. Cuerpo de texto: más liviano que el titular, sin perder contraste. */
export const BODY_TEXT = '#3f3f46';
/** --color-muted-foreground (Zinc 500). Texto secundario. */
export const MUTED = '#71717a';
/** --color-border (Zinc 200). */
export const BORDER = '#e4e4e7';
/** --color-card / --color-muted (Zinc 100). Fondo de la página del mail. */
export const SURFACE = '#f4f4f5';
export const WHITE = '#ffffff';

/** --radius-xl / md, en px para clientes de correo. */
export const RADIUS_CARD = '16px';
export const RADIUS_BOX = '12px';

/**
 * Las fuentes de la marca (Outfit para títulos, Inter para cuerpo). Gmail
 * ignora los @import y cae al stack del sistema — por eso van siempre con
 * fallback completo y nunca se depende de que carguen.
 */
export const FONT_HEADING =
  "'Outfit','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
export const FONT_BODY =
  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/** Logo servido desde el sitio (verificado 200 en povstore.uy). */
export const LOGO_URL = 'https://povstore.uy/images/logo-pov.png';

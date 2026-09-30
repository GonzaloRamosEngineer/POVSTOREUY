// src/lib/email/renderOrderEmail.ts
//
// Render de los mails transaccionales de orden (HTML + texto plano).
//
// HTML deliberadamente conservador: tablas, estilos inline y nada de flex/grid.
// Los clientes de correo (Outlook, Gmail app) no soportan CSS moderno y el
// sistema de diseño del sitio no aplica acá.

import { emailMessages, SITE_LABEL, SUPPORT_EMAIL } from '@/messages/emailMessages';
import { buildOrderEmailLines, formatUYU, type OrderEmailItemRow } from './orderEmailData';
import {
  BODY_TEXT,
  BORDER,
  BRAND_RED,
  FONT_BODY,
  FONT_HEADING,
  INK,
  LOGO_URL,
  MUTED,
  RADIUS_BOX,
  RADIUS_CARD,
  SURFACE,
  WHITE,
} from './brand';

export type OrderEmailKind = 'confirmed' | 'processing' | 'shipped' | 'ready';

export type RenderOrderEmailInput = {
  kind: OrderEmailKind;
  orderNumber: string;
  customerName?: string | null;
  items: OrderEmailItemRow[];
  subtotal?: number | null;
  shippingCost?: number | null;
  total?: number | null;
  isPickup: boolean;
  trackingNumber?: string | null;
  pickupAddress?: string | null;
  /** URL firmada a /order-confirmation. Si falta, el mail va sin botón. */
  statusUrl?: string | null;
};

export type RenderedEmail = { subject: string; html: string; text: string };

/**
 * Los importes se muestran SÓLO en el mail de compra confirmada: ahí el mail
 * hace de comprobante. En preparación / listo / despachado el precio no
 * aporta nada y repetir el monto en cada aviso se lee como un cobro nuevo.
 */
function showsPrices(kind: OrderEmailKind): boolean {
  return kind === 'confirmed';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bloque variable según el tipo de mail: [título, párrafos...] */
function bodyBlocks(input: RenderOrderEmailInput): { title: string; paragraphs: string[]; highlight?: { label: string; value: string } } {
  const { kind } = input;

  if (kind === 'shipped') {
    const m = emailMessages.shipped;
    return {
      title: m.title,
      paragraphs: [m.body, m.estimate],
      highlight: input.trackingNumber
        ? { label: m.trackingLabel, value: input.trackingNumber }
        : undefined,
    };
  }

  if (kind === 'ready') {
    const m = emailMessages.ready;
    return {
      title: m.title,
      paragraphs: [m.body],
      highlight: input.pickupAddress
        ? { label: m.addressLabel, value: input.pickupAddress }
        : undefined,
    };
  }

  const m = kind === 'confirmed' ? emailMessages.confirmed : emailMessages.processing;
  return {
    title: m.title,
    paragraphs: [m.body, input.isPickup ? m.nextStepPickup : m.nextStepDelivery],
  };
}

function subjectFor(input: RenderOrderEmailInput): string {
  const { kind, orderNumber } = input;
  if (kind === 'shipped') return emailMessages.shipped.subject(orderNumber);
  if (kind === 'ready') return emailMessages.ready.subject(orderNumber);
  if (kind === 'confirmed') return emailMessages.confirmed.subject(orderNumber);
  return emailMessages.processing.subject(orderNumber);
}

function preheaderFor(kind: OrderEmailKind): string {
  if (kind === 'shipped') return emailMessages.shipped.preheader;
  if (kind === 'ready') return emailMessages.ready.preheader;
  if (kind === 'confirmed') return emailMessages.confirmed.preheader;
  return emailMessages.processing.preheader;
}

export function renderOrderEmail(input: RenderOrderEmailInput): RenderedEmail {
  const c = emailMessages.common;
  const lines = buildOrderEmailLines(input.items || []);
  const { title, paragraphs, highlight } = bodyBlocks(input);
  const subject = subjectFor(input);

  // ---------- texto plano ----------
  const textParts: string[] = [
    c.greeting(input.customerName),
    '',
    ...paragraphs,
    '',
    c.orderLabel(input.orderNumber),
  ];

  if (highlight) textParts.push(`${highlight.label}: ${highlight.value}`);
  textParts.push('');

  const withPrices = showsPrices(input.kind);

  for (const line of lines) {
    const qty = line.quantity > 1 ? `${line.quantity} x ` : '';
    const price = withPrices ? ` — ${formatUYU(line.totalPrice)}` : '';
    textParts.push(`  ${qty}${line.name}${price}`);
    if (line.includes.length) {
      textParts.push(`  ${c.includesLabel}`);
      for (const inc of line.includes) textParts.push(`    · ${inc}`);
    }
  }

  if (withPrices && typeof input.total === 'number') {
    textParts.push('', `  ${c.totalLabel}: ${formatUYU(input.total)}`);
  }

  if (input.statusUrl) {
    textParts.push('', `${c.trackCta}: ${input.statusUrl}`, c.trackHint);
  }

  textParts.push('', c.footerReply, '', c.signature, c.footerContact);
  const text = textParts.join('\n');

  // ---------- HTML ----------
  // Paleta y tipografías espejadas del sitio (./brand.ts). Todo inline y en
  // tablas: los clientes de correo no soportan flex/grid ni hojas de estilo.
  const itemRows = lines
    .map((line, i) => {
      const qty = line.quantity > 1 ? `${line.quantity} × ` : '';
      const topBorder = i === 0 ? '' : `border-top:1px solid ${BORDER};`;
      const includes = line.includes.length
        ? `<div style="margin-top:8px;color:${MUTED};font-size:13px;line-height:1.7;">
             <span style="color:${INK};font-weight:600;">${escapeHtml(c.includesLabel)}</span><br>
             ${line.includes.map((inc) => `${escapeHtml(inc)}`).join('<br>')}
           </div>`
        : '';
      const priceCell = withPrices
        ? `<td style="padding:16px 0;${topBorder}text-align:right;vertical-align:top;color:${INK};font-size:15px;font-weight:600;white-space:nowrap;">
             ${escapeHtml(formatUYU(line.totalPrice))}
           </td>`
        : '';
      return `
        <tr>
          <td style="padding:16px 0;${topBorder}vertical-align:top;">
            <div style="color:${INK};font-size:15px;font-weight:700;font-family:${FONT_HEADING};letter-spacing:-.01em;">${escapeHtml(qty + line.name)}</div>
            ${includes}
          </td>
          ${priceCell}
        </tr>`;
    })
    .join('');

  const totalsRows: string[] = [];
  if (withPrices && typeof input.subtotal === 'number' && typeof input.total === 'number') {
    totalsRows.push(
      `<tr><td style="padding:5px 0;color:${MUTED};font-size:14px;">${escapeHtml(c.subtotalLabel)}</td>
           <td style="padding:5px 0;text-align:right;color:${BODY_TEXT};font-size:14px;">${escapeHtml(formatUYU(input.subtotal))}</td></tr>`
    );
    const shipping = input.shippingCost ?? 0;
    totalsRows.push(
      `<tr><td style="padding:5px 0;color:${MUTED};font-size:14px;">${escapeHtml(c.shippingLabel)}</td>
           <td style="padding:5px 0;text-align:right;color:${BODY_TEXT};font-size:14px;">${
             shipping > 0 ? escapeHtml(formatUYU(shipping)) : escapeHtml(c.shippingFree)
           }</td></tr>`
    );
  }
  if (withPrices && typeof input.total === 'number') {
    totalsRows.push(
      `<tr>
         <td style="padding:12px 0 0;border-top:2px solid ${INK};color:${INK};font-size:17px;font-weight:800;font-family:${FONT_HEADING};">${escapeHtml(c.totalLabel)}</td>
         <td style="padding:12px 0 0;border-top:2px solid ${INK};text-align:right;color:${INK};font-size:17px;font-weight:800;font-family:${FONT_HEADING};">${escapeHtml(formatUYU(input.total))}</td>
       </tr>`
    );
  }

  const ctaBlock = input.statusUrl
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
         <tr><td align="center">
           <a href="${escapeHtml(input.statusUrl)}" style="display:inline-block;background:${BRAND_RED};color:${WHITE};text-decoration:none;font-size:15px;font-weight:700;font-family:${FONT_HEADING};letter-spacing:.01em;padding:15px 34px;border-radius:${RADIUS_BOX};">${escapeHtml(c.trackCta)}</a>
         </td></tr>
         <tr><td align="center" style="padding-top:12px;color:${MUTED};font-size:12px;line-height:1.6;">${escapeHtml(c.trackHint)}</td></tr>
       </table>`
    : '';

  // Caja destacada (tracking o dirección de retiro): filete rojo a la
  // izquierda, el mismo recurso que el sitio usa para destacar.
  const highlightBlock = highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${SURFACE};border-left:4px solid ${BRAND_RED};border-radius:${RADIUS_BOX};">
         <tr><td style="padding:16px 20px;">
           <div style="color:${MUTED};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(highlight.label)}</div>
           <div style="color:${INK};font-size:19px;font-weight:800;font-family:${FONT_HEADING};margin-top:5px;letter-spacing:-.01em;">${escapeHtml(highlight.value)}</div>
         </td></tr>
       </table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT_BODY};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheaderFor(input.kind))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${WHITE};border:1px solid ${BORDER};border-radius:${RADIUS_CARD};overflow:hidden;font-family:${FONT_BODY};">

      <!-- Filete de marca -->
      <tr><td style="background:${BRAND_RED};height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>

      <!-- Logo -->
      <tr><td align="center" style="padding:30px 28px 6px;">
        <img src="${LOGO_URL}" width="132" alt="POV Store" style="display:block;width:132px;max-width:60%;height:auto;border:0;">
      </td></tr>

      <!-- Contenido -->
      <tr><td style="padding:14px 34px 30px;">
        <h1 style="margin:0 0 4px;color:${INK};font-size:24px;line-height:1.25;font-family:${FONT_HEADING};font-weight:800;letter-spacing:-.02em;text-align:center;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 26px;color:${MUTED};font-size:13px;text-align:center;letter-spacing:.02em;">${escapeHtml(c.orderLabel(input.orderNumber))}</p>

        <p style="margin:0 0 14px;color:${INK};font-size:15px;line-height:1.65;font-weight:600;">${escapeHtml(c.greeting(input.customerName))}</p>
        ${paragraphs
          .map((p) => `<p style="margin:0 0 14px;color:${BODY_TEXT};font-size:15px;line-height:1.65;">${escapeHtml(p)}</p>`)
          .join('')}
        ${highlightBlock}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:2px solid ${INK};">${itemRows}</table>
        ${totalsRows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${totalsRows.join('')}</table>` : ''}
        ${ctaBlock}

        <p style="margin:26px 0 0;padding-top:20px;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px;line-height:1.6;">${escapeHtml(c.footerReply)}</p>
      </td></tr>

      <!-- Pie -->
      <tr><td style="padding:22px 34px 28px;background:${SURFACE};border-top:1px solid ${BORDER};">
        <div style="color:${INK};font-size:14px;font-weight:700;font-family:${FONT_HEADING};">${escapeHtml(c.signature)}</div>
        <div style="color:${MUTED};font-size:13px;margin-top:5px;">
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};text-decoration:none;">${SUPPORT_EMAIL}</a>
          <span style="color:${BORDER};"> &nbsp;|&nbsp; </span>
          <a href="https://${SITE_LABEL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600;">${SITE_LABEL}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}

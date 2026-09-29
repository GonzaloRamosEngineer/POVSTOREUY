// src/lib/email/renderOrderEmail.ts
//
// Render de los mails transaccionales de orden (HTML + texto plano).
//
// HTML deliberadamente conservador: tablas, estilos inline y nada de flex/grid.
// Los clientes de correo (Outlook, Gmail app) no soportan CSS moderno y el
// sistema de diseño del sitio no aplica acá.

import { emailMessages, SITE_LABEL, SUPPORT_EMAIL } from '@/messages/emailMessages';
import { buildOrderEmailLines, formatUYU, type OrderEmailItemRow } from './orderEmailData';

const INK = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const ACCENT = '#0f172a';

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
};

export type RenderedEmail = { subject: string; html: string; text: string };

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

  for (const line of lines) {
    const qty = line.quantity > 1 ? `${line.quantity} x ` : '';
    textParts.push(`  ${qty}${line.name} — ${formatUYU(line.totalPrice)}`);
    if (line.includes.length) {
      textParts.push(`  ${c.includesLabel}`);
      for (const inc of line.includes) textParts.push(`    · ${inc}`);
    }
  }

  if (typeof input.total === 'number') {
    textParts.push('', `  ${c.totalLabel}: ${formatUYU(input.total)}`);
  }

  textParts.push('', c.footerReply, '', c.signature, c.footerContact);
  const text = textParts.join('\n');

  // ---------- HTML ----------
  const itemRows = lines
    .map((line) => {
      const qty = line.quantity > 1 ? `${line.quantity} × ` : '';
      const includes = line.includes.length
        ? `<div style="margin-top:6px;color:${MUTED};font-size:13px;line-height:1.6;">
             ${escapeHtml(c.includesLabel)}<br>
             ${line.includes.map((i) => `· ${escapeHtml(i)}`).join('<br>')}
           </div>`
        : '';
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
            <div style="color:${INK};font-size:15px;font-weight:600;">${escapeHtml(qty + line.name)}</div>
            ${includes}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;vertical-align:top;color:${INK};font-size:15px;white-space:nowrap;">
            ${escapeHtml(formatUYU(line.totalPrice))}
          </td>
        </tr>`;
    })
    .join('');

  const totalsRows: string[] = [];
  if (typeof input.subtotal === 'number' && typeof input.total === 'number') {
    totalsRows.push(
      `<tr><td style="padding:6px 0;color:${MUTED};font-size:14px;">${escapeHtml(c.subtotalLabel)}</td>
           <td style="padding:6px 0;text-align:right;color:${MUTED};font-size:14px;">${escapeHtml(formatUYU(input.subtotal))}</td></tr>`
    );
    const shipping = input.shippingCost ?? 0;
    totalsRows.push(
      `<tr><td style="padding:6px 0;color:${MUTED};font-size:14px;">${escapeHtml(c.shippingLabel)}</td>
           <td style="padding:6px 0;text-align:right;color:${MUTED};font-size:14px;">${
             shipping > 0 ? escapeHtml(formatUYU(shipping)) : escapeHtml(c.shippingFree)
           }</td></tr>`
    );
  }
  if (typeof input.total === 'number') {
    totalsRows.push(
      `<tr><td style="padding:10px 0 0;color:${INK};font-size:16px;font-weight:700;">${escapeHtml(c.totalLabel)}</td>
           <td style="padding:10px 0 0;text-align:right;color:${INK};font-size:16px;font-weight:700;">${escapeHtml(formatUYU(input.total))}</td></tr>`
    );
  }

  const highlightBlock = highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f8fafc;border:1px solid ${BORDER};border-radius:10px;">
         <tr><td style="padding:16px 18px;">
           <div style="color:${MUTED};font-size:12px;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(highlight.label)}</div>
           <div style="color:${INK};font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(highlight.value)}</div>
         </td></tr>
       </table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheaderFor(input.kind))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <tr><td style="background:${ACCENT};padding:20px 28px;">
        <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:.02em;">POV STORE</div>
      </td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 6px;color:${INK};font-size:21px;line-height:1.3;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 18px;color:${MUTED};font-size:14px;">${escapeHtml(c.orderLabel(input.orderNumber))}</p>
        <p style="margin:0 0 12px;color:${INK};font-size:15px;line-height:1.6;">${escapeHtml(c.greeting(input.customerName))}</p>
        ${paragraphs
          .map((p) => `<p style="margin:0 0 12px;color:${INK};font-size:15px;line-height:1.6;">${escapeHtml(p)}</p>`)
          .join('')}
        ${highlightBlock}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${itemRows}</table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">${totalsRows.join('')}</table>
        <p style="margin:22px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">${escapeHtml(c.footerReply)}</p>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid ${BORDER};">
        <div style="color:${INK};font-size:14px;font-weight:600;">${escapeHtml(c.signature)}</div>
        <div style="color:${MUTED};font-size:13px;margin-top:4px;">
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};text-decoration:none;">${SUPPORT_EMAIL}</a> ·
          <a href="https://${SITE_LABEL}" style="color:${MUTED};text-decoration:none;">${SITE_LABEL}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}

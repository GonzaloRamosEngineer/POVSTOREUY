// src/lib/email/resendClient.ts
//
// Cliente mínimo de Resend sobre fetch (sin SDK: una dependencia menos y
// funciona igual en el runtime de Vercel). Server-only.
//
// Config por env vars:
//   RESEND_API_KEY   — obligatoria. Si falta, sendEmail es NO-OP y loguea.
//   EMAIL_FROM       — opcional. Default: "POV Store <info@povstore.uy>".
//   EMAIL_REPLY_TO   — opcional. Default: info@povstore.uy.
//
// El dominio povstore.uy se verifica en Resend para PODER enviar; la casilla
// sigue siendo la de Spacemail (MX intacto), así que las respuestas del
// cliente caen en la bandeja de siempre.

import { SENDER_EMAIL, SENDER_NAME } from '@/messages/emailMessages';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Agrupa envíos en el dashboard de Resend (ej: "order-processing"). */
  tag?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null; skipped?: false }
  | { ok: true; id: null; skipped: true; reason: 'missing_api_key' }
  | { ok: false; reason: string };

export function getFromAddress(): string {
  return process.env.EMAIL_FROM || `${SENDER_NAME} <${SENDER_EMAIL}>`;
}

export function getReplyToAddress(): string {
  return process.env.EMAIL_REPLY_TO || SENDER_EMAIL;
}

/**
 * Envía un mail vía Resend. NUNCA lanza: un fallo de mail no debe tumbar
 * la operación de negocio que lo disparó (ej: actualizar una orden).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY ausente — mail "${input.subject}" a ${input.to} NO enviado`
    );
    return { ok: true, id: null, skipped: true, reason: 'missing_api_key' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [input.to],
        reply_to: getReplyToAddress(),
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.tag ? { tags: [{ name: 'type', value: input.tag }] } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[email] Resend respondió ${res.status}: ${detail}`);
      return { ok: false, reason: `resend_${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    console.log(`[email] Enviado "${input.subject}" a ${input.to} (id: ${data.id ?? 's/d'})`);
    return { ok: true, id: data.id ?? null };
  } catch (error: any) {
    console.error('[email] Error de red al llamar a Resend:', error?.message);
    return { ok: false, reason: 'network_error' };
  }
}

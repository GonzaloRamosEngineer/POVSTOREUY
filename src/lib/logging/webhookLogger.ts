// Logger estructurado mínimo para webhooks.
// JSON output a stdout/stderr — friendly para Vercel Logs y futuro pipe a Sentry/Logtail/Grafana.
// Sin dependencias externas, sin batching. Si en el futuro se suma observabilidad real,
// reemplazar este helper por el client del proveedor (Sentry.captureException, etc.).

export type WebhookLogLevel = 'info' | 'warn' | 'error';

export type WebhookLogContext = {
  paymentId?: string;
  orderId?: string;
  mpStatus?: string;
  reason?: string;
  errorMessage?: string;
  errorName?: string;
  [key: string]: unknown;
};

export type WebhookLogEntry = {
  ts: string;
  level: WebhookLogLevel;
  source: 'mp-webhook';
  msg: string;
} & WebhookLogContext;

export function logWebhookEvent(
  level: WebhookLogLevel,
  msg: string,
  context: WebhookLogContext = {},
): void {
  const entry: WebhookLogEntry = {
    ts: new Date().toISOString(),
    level,
    source: 'mp-webhook',
    msg,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

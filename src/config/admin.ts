/**
 * Configuración compartida del panel admin.
 * Cambios acá no requieren tocar componentes individuales.
 */

export const ADMIN_CONFIG = {
  ordersList: {
    defaultPageSize: 25,
    maxPageSize: 100,
    staleDefaultDays: 7,
    dashboardLookbackDays: 30,
  },
  stock: {
    criticalThreshold: 5,
    lowThreshold: 10,
  },
} as const;

/**
 * Fecha de corte para los mails transaccionales al cliente.
 *
 * NINGUNA orden creada antes de este instante notifica al cliente, sin
 * importar qué se haga con su estado. Existe porque al encender los mails
 * (2026-09-29) el histórico ya estaba comunicado a mano por WhatsApp: mover
 * una orden vieja en el panel le habría mandado al cliente un aviso viejo y
 * fuera de contexto.
 *
 * NO moverla "para probar": para probar, creá una orden nueva. Bajarla
 * habilita de golpe todo el histórico.
 */
export const ORDER_EMAIL_CUTOFF = new Date('2026-09-29T23:59:59-03:00');

/** True si la orden es posterior al corte y por lo tanto puede notificar. */
export function isOrderNotifiable(createdAt: string | Date | null | undefined): boolean {
  if (!createdAt) return false;
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created > ORDER_EMAIL_CUTOFF;
}

/**
 * Heurística para identificar órdenes de prueba/QA por email.
 * Activable con el toggle "excluir test" en el filtro de historial.
 * Si necesitás invalidar más casos, sumalos acá (no en el componente).
 */
export const TEST_EMAIL_PATTERNS: RegExp[] = [
  /^qa-/i,
  /^prueba/i,
  /^prueuab/i,
  /^test/i,
  /@prueba\.com$/i,
  /^admin@demo\./i,
  /^mercadolibre@mercadopago\./i,
  /^asdasd/i,
];

/**
 * Versión ILIKE de TEST_EMAIL_PATTERNS para Postgres/Supabase.
 * Mantener sincronizada con la lista de regex de arriba.
 */
export const TEST_EMAIL_ILIKE_PATTERNS: string[] = [
  'qa-%',
  'prueba%',
  'prueuab%',
  'test%',
  '%@prueba.com',
  'admin@demo.%',
  'mercadolibre@mercadopago.%',
  'asdasd%',
];

export function isTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return TEST_EMAIL_PATTERNS.some((re) => re.test(email));
}

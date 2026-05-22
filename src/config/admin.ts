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

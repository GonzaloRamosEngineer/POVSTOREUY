import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentSupabase: any = null;

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => currentSupabase),
}));

import { GET } from './route';

type Captured = {
  filters: Array<{ op: string; column?: string; value?: any; values?: any }>;
  order: { field: string; ascending: boolean } | null;
  range: { from: number; to: number } | null;
  selectArgs: Array<{ fields: string; opts?: any }>;
};

/**
 * Devuelve un mock de Supabase que captura las llamadas encadenadas a `from('orders')`.
 * Cada query (.select, .eq, .in, .gte, .lte, .lt, .or, .not, .order, .range) registra su acción.
 * El resultado final se entrega vía `then`-like: la promise se resuelve cuando el caller
 * la await-ea (lo logramos haciendo que la última call que el route hace devuelva la "Promise").
 *
 * Para simplificar: el chain construye un objeto con todos los métodos encadenables.
 * El route awaita el resultado de range() (main) o del último filtro (summary).
 * Implementamos esto haciendo que cada método retorne `chain` y que `chain` sea thenable.
 */
function makeOrdersChain(initial: {
  rows: any[];
  count: number;
  forceError?: { message: string } | null;
}) {
  const captured: Captured = {
    filters: [],
    order: null,
    range: null,
    selectArgs: [],
  };

  const chain: any = {};

  chain.select = (fields: string, opts?: any) => {
    captured.selectArgs.push({ fields, opts });
    return chain;
  };
  chain.eq = (column: string, value: any) => {
    captured.filters.push({ op: 'eq', column, value });
    return chain;
  };
  chain.in = (column: string, values: any[]) => {
    captured.filters.push({ op: 'in', column, values });
    return chain;
  };
  chain.gte = (column: string, value: any) => {
    captured.filters.push({ op: 'gte', column, value });
    return chain;
  };
  chain.lte = (column: string, value: any) => {
    captured.filters.push({ op: 'lte', column, value });
    return chain;
  };
  chain.lt = (column: string, value: any) => {
    captured.filters.push({ op: 'lt', column, value });
    return chain;
  };
  chain.or = (expr: string) => {
    captured.filters.push({ op: 'or', value: expr });
    return chain;
  };
  chain.not = (column: string, op: string, value: any) => {
    captured.filters.push({ op: `not.${op}`, column, value });
    return chain;
  };
  chain.order = (field: string, opts: { ascending: boolean }) => {
    captured.order = { field, ascending: opts.ascending };
    return chain;
  };
  chain.range = (from: number, to: number) => {
    captured.range = { from, to };
    return chain;
  };

  // Hacemos el chain "thenable" para que await chain resuelva.
  chain.then = (resolve: any) => {
    const payload: any = {
      data: initial.forceError ? null : initial.rows,
      error: initial.forceError || null,
    };
    if (captured.range) payload.count = initial.count;
    resolve(payload);
  };

  return { chain, captured };
}

function makeSupabaseMock(opts: {
  userRole?: string;
  mainRows: any[];
  summaryRows: any[];
  mainCount?: number;
  forceMainError?: { message: string } | null;
}) {
  const userRole = opts.userRole ?? 'admin';

  const ordersChains: Array<ReturnType<typeof makeOrdersChain>> = [];
  let ordersCallCount = 0;

  const supabase = {
    auth: {
      getUser: async (_token: string) => ({
        data: { user: { id: 'admin-user-id' } },
        error: null,
      }),
    },
    from: (table: string) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { role: userRole }, error: null }),
            }),
          }),
        };
      }
      if (table === 'orders') {
        ordersCallCount += 1;
        const isMain = ordersCallCount === 1;
        const chain = makeOrdersChain({
          rows: isMain ? opts.mainRows : opts.summaryRows,
          count: opts.mainCount ?? opts.mainRows.length,
          forceError: isMain ? opts.forceMainError ?? null : null,
        });
        ordersChains.push(chain);
        return chain.chain;
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { supabase, ordersChains };
}

function buildRequest(qs: string, opts?: { withAuth?: boolean }) {
  const withAuth = opts?.withAuth ?? true;
  const headers: Record<string, string> = {};
  if (withAuth) headers.Authorization = 'Bearer test-admin-token';
  const url = `http://localhost/api/admin/orders${qs ? `?${qs}` : ''}`;
  return new Request(url, { method: 'GET', headers });
}

describe('admin orders list GET', () => {
  beforeEach(() => {
    currentSupabase = null;
  });

  it('rechaza request sin Authorization (401)', async () => {
    const { supabase } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('', { withAuth: false }) as any);
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('rechaza usuario sin rol admin (403)', async () => {
    const { supabase } = makeSupabaseMock({
      userRole: 'customer',
      mainRows: [],
      summaryRows: [],
    });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('') as any);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeTruthy();
  });

  it('devuelve órdenes paginadas con summary calculado', async () => {
    const mainRows = [
      { id: 'o1', order_number: 'POV-1', total: 1000, payment_status: 'completed' },
      { id: 'o2', order_number: 'POV-2', total: 500, payment_status: 'pending' },
    ];
    const summaryRows = [
      { total: 1000, payment_status: 'completed' },
      { total: 500, payment_status: 'pending' },
      { total: 2000, payment_status: 'completed' },
    ];
    const { supabase, ordersChains } = makeSupabaseMock({
      mainRows,
      summaryRows,
      mainCount: 3,
    });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('limit=2&page=1') as any);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      total_pages: 2,
    });
    expect(res.body.summary.paid_count).toBe(2);
    expect(res.body.summary.total_revenue).toBe(3000);
    expect(res.body.summary.aov).toBe(1500);
    expect(res.body.summary.match_count).toBe(3);

    // Validamos que el rango aplicado al main fue [0, 1] (page=1 limit=2)
    expect(ordersChains[0].captured.range).toEqual({ from: 0, to: 1 });
    // Y que el order es created_at desc por default
    expect(ordersChains[0].captured.order).toEqual({ field: 'created_at', ascending: false });
  });

  it('aplica filtros status, payment_method, payment_status, department, rango fechas y montos', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const qs = new URLSearchParams({
      status: 'pending,completed',
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      department: 'Montevideo',
      from: '2026-01-01',
      to: '2026-04-30',
      min_total: '100',
      max_total: '10000',
    }).toString();

    const res: any = await GET(buildRequest(qs) as any);
    expect(res.status).toBe(200);

    const filters = ordersChains[0].captured.filters;
    expect(filters).toContainEqual({ op: 'in', column: 'order_status', values: ['pending', 'completed'] });
    expect(filters).toContainEqual({ op: 'in', column: 'payment_method', values: ['bank_transfer'] });
    expect(filters).toContainEqual({ op: 'in', column: 'payment_status', values: ['pending'] });
    expect(filters).toContainEqual({ op: 'eq', column: 'shipping_department', value: 'Montevideo' });
    expect(filters).toContainEqual({ op: 'gte', column: 'total', value: 100 });
    expect(filters).toContainEqual({ op: 'lte', column: 'total', value: 10000 });
    expect(filters.some((f) => f.op === 'gte' && f.column === 'created_at')).toBe(true);
    expect(filters.some((f) => f.op === 'lte' && f.column === 'created_at')).toBe(true);
  });

  it('exclude_test agrega los not ilike por cada patrón', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('exclude_test=true') as any);
    expect(res.status).toBe(200);

    const notIlikes = ordersChains[0].captured.filters.filter((f) => f.op === 'not.ilike');
    expect(notIlikes.length).toBeGreaterThanOrEqual(8);
    expect(notIlikes.every((f) => f.column === 'customer_email')).toBe(true);
  });

  it('stale_days fuerza order_status=pending y created_at < cutoff', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('stale_days=7') as any);
    expect(res.status).toBe(200);

    const filters = ordersChains[0].captured.filters;
    expect(filters).toContainEqual({ op: 'eq', column: 'order_status', value: 'pending' });
    expect(filters.some((f) => f.op === 'lt' && f.column === 'created_at')).toBe(true);
  });

  it('q construye un .or con ilike sobre 5 columnas', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('q=mateos') as any);
    expect(res.status).toBe(200);

    const orFilter = ordersChains[0].captured.filters.find((f) => f.op === 'or');
    expect(orFilter).toBeTruthy();
    expect(orFilter!.value).toContain('order_number.ilike.%mateos%');
    expect(orFilter!.value).toContain('customer_email.ilike.%mateos%');
    expect(orFilter!.value).toContain('customer_name.ilike.%mateos%');
    expect(orFilter!.value).toContain('customer_phone.ilike.%mateos%');
    expect(orFilter!.value).toContain('tracking_number.ilike.%mateos%');
  });

  it('q escapa caracteres % y _ para que no actúen como wildcards', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('q=50%25_test') as any);
    expect(res.status).toBe(200);

    const orFilter = ordersChains[0].captured.filters.find((f) => f.op === 'or');
    expect(orFilter!.value).toContain('\\%');
    expect(orFilter!.value).toContain('\\_');
  });

  it('rechaza status inválido (400)', async () => {
    const { supabase } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('status=foo') as any);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('foo');
  });

  it('rechaza payment_method inválido (400)', async () => {
    const { supabase } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('payment_method=bitcoin') as any);
    expect(res.status).toBe(400);
  });

  it('rechaza from > to (400)', async () => {
    const { supabase } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('from=2026-04-01&to=2026-01-01') as any);
    expect(res.status).toBe(400);
  });

  it('rechaza sort inválido (400)', async () => {
    const { supabase } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('sort=password:desc') as any);
    expect(res.status).toBe(400);
  });

  it('respeta sort=total:asc', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('sort=total:asc') as any);
    expect(res.status).toBe(200);
    expect(ordersChains[0].captured.order).toEqual({ field: 'total', ascending: true });
  });

  it('clamp de limit a max permitido', async () => {
    const { supabase, ordersChains } = makeSupabaseMock({ mainRows: [], summaryRows: [] });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('limit=9999') as any);
    expect(res.status).toBe(200);
    // page=1, limit=100 → range [0, 99]
    expect(ordersChains[0].captured.range).toEqual({ from: 0, to: 99 });
    expect(res.body.pagination.limit).toBe(100);
  });

  it('500 si la query principal falla', async () => {
    const { supabase } = makeSupabaseMock({
      mainRows: [],
      summaryRows: [],
      forceMainError: { message: 'connection refused' },
    });
    currentSupabase = supabase;

    const res: any = await GET(buildRequest('') as any);
    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});

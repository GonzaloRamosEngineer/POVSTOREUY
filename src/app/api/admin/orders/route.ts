import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { adminOrdersListMessages } from '@/messages/adminOrdersListMessages';
import { ADMIN_CONFIG, TEST_EMAIL_ILIKE_PATTERNS } from '@/config/admin';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'] as const;
const ALLOWED_PAYMENT_METHODS = ['mercadopago', 'bank_transfer'] as const;
const ALLOWED_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
const ALLOWED_SORT_FIELDS = ['created_at', 'total', 'order_number'] as const;

const SELECT_FIELDS =
  'id, order_number, customer_name, customer_email, customer_phone, total, subtotal, shipping_cost, order_status, payment_method, payment_status, payment_id, created_at, updated_at, shipping_address, shipping_city, shipping_department, delivery_method, tracking_number, mp_status, mp_status_detail, notes';

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getBearerToken(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!h.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim();
}

async function requireAdmin(req: Request) {
  const { auth } = adminOrdersListMessages;
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, res: json(401, { error: auth.missingToken }) };

  const supabase = getSupabaseAdmin();
  const { data: userData, error: uErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (uErr || !user) return { ok: false as const, res: json(401, { error: auth.invalidToken }) };

  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (pErr || !profile || profile.role !== 'admin') {
    return { ok: false as const, res: json(403, { error: auth.adminRequired }) };
  }

  return { ok: true as const, supabase };
}

function parseCsvList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIsoDate(raw: string | null): Date | null | 'invalid' {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'invalid';
  return d;
}

function parseNumber(raw: string | null): number | null | 'invalid' {
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 'invalid';
  return n;
}

function parseBool(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

function parseSort(raw: string | null): { field: string; ascending: boolean } | 'invalid' {
  if (!raw) return { field: 'created_at', ascending: false };
  const [field, dir = 'desc'] = raw.split(':');
  if (!ALLOWED_SORT_FIELDS.includes(field as any)) return 'invalid';
  if (dir !== 'asc' && dir !== 'desc') return 'invalid';
  return { field, ascending: dir === 'asc' };
}

function escapeIlike(s: string): string {
  // Escapamos % y _ para que el wildcard del usuario no se interprete como SQL.
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function GET(req: Request) {
  const { validation, responses } = adminOrdersListMessages;

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const sp = url.searchParams;

    // --- Parseo y validación de filtros ---
    const statusList = parseCsvList(sp.get('status'));
    for (const s of statusList) {
      if (!ALLOWED_STATUSES.includes(s as any)) return json(400, { error: validation.invalidStatus(s) });
    }

    const methodList = parseCsvList(sp.get('payment_method'));
    for (const m of methodList) {
      if (!ALLOWED_PAYMENT_METHODS.includes(m as any)) {
        return json(400, { error: validation.invalidPaymentMethod(m) });
      }
    }

    const paymentStatusList = parseCsvList(sp.get('payment_status'));
    for (const ps of paymentStatusList) {
      if (!ALLOWED_PAYMENT_STATUSES.includes(ps as any)) {
        return json(400, { error: validation.invalidPaymentStatus(ps) });
      }
    }

    const department = (sp.get('department') || '').trim();
    const q = (sp.get('q') || '').trim();

    const from = parseIsoDate(sp.get('from'));
    if (from === 'invalid') return json(400, { error: validation.invalidDate('from') });
    const to = parseIsoDate(sp.get('to'));
    if (to === 'invalid') return json(400, { error: validation.invalidDate('to') });
    if (from && to && from.getTime() > to.getTime()) {
      return json(400, { error: validation.invalidRange });
    }

    const minTotal = parseNumber(sp.get('min_total'));
    if (minTotal === 'invalid') return json(400, { error: validation.invalidNumber('min_total') });
    const maxTotal = parseNumber(sp.get('max_total'));
    if (maxTotal === 'invalid') return json(400, { error: validation.invalidNumber('max_total') });

    const excludeTest = parseBool(sp.get('exclude_test'));

    const staleDays = parseNumber(sp.get('stale_days'));
    if (staleDays === 'invalid') return json(400, { error: validation.invalidNumber('stale_days') });

    const sort = parseSort(sp.get('sort'));
    if (sort === 'invalid') return json(400, { error: validation.invalidSort });

    let page = parseNumber(sp.get('page'));
    if (page === 'invalid') return json(400, { error: validation.invalidNumber('page') });
    if (page === null || (page as number) < 1) page = 1;

    let limit = parseNumber(sp.get('limit'));
    if (limit === 'invalid') return json(400, { error: validation.invalidNumber('limit') });
    if (limit === null) limit = ADMIN_CONFIG.ordersList.defaultPageSize;
    limit = Math.min(Math.max(1, limit as number), ADMIN_CONFIG.ordersList.maxPageSize);

    // --- Construcción de la query base reutilizable ---
    const applyFilters = (query: any) => {
      if (statusList.length) query = query.in('order_status', statusList);
      if (methodList.length) query = query.in('payment_method', methodList);
      if (paymentStatusList.length) query = query.in('payment_status', paymentStatusList);
      if (department) query = query.eq('shipping_department', department);
      if (from) query = query.gte('created_at', from.toISOString());
      if (to) query = query.lte('created_at', to.toISOString());
      if (minTotal !== null) query = query.gte('total', minTotal);
      if (maxTotal !== null) query = query.lte('total', maxTotal);

      if (excludeTest) {
        for (const pattern of TEST_EMAIL_ILIKE_PATTERNS) {
          query = query.not('customer_email', 'ilike', pattern);
        }
      }

      if (staleDays !== null && (staleDays as number) > 0) {
        const cutoff = new Date(Date.now() - (staleDays as number) * 86400 * 1000).toISOString();
        query = query.eq('order_status', 'pending').lt('created_at', cutoff);
      }

      if (q) {
        const safe = escapeIlike(q);
        query = query.or(
          [
            `order_number.ilike.%${safe}%`,
            `customer_email.ilike.%${safe}%`,
            `customer_name.ilike.%${safe}%`,
            `customer_phone.ilike.%${safe}%`,
            `tracking_number.ilike.%${safe}%`,
          ].join(',')
        );
      }

      return query;
    };

    // --- Query principal paginada con count ---
    const offset = ((page as number) - 1) * (limit as number);
    let mainQuery = auth.supabase
      .from('orders')
      .select(SELECT_FIELDS, { count: 'exact' })
      .order(sort.field, { ascending: sort.ascending })
      .range(offset, offset + (limit as number) - 1);

    mainQuery = applyFilters(mainQuery);

    const { data: orders, error: oErr, count } = await mainQuery;
    if (oErr) {
      console.error('admin/orders main query error:', oErr);
      return json(500, { error: responses.serverError, details: oErr.message });
    }

    // --- Summary: agregamos sobre todos los matches (no solo la página actual) ---
    let summaryQuery = auth.supabase.from('orders').select('total, payment_status');
    summaryQuery = applyFilters(summaryQuery);

    const { data: summaryRows, error: sErr } = await summaryQuery;
    if (sErr) {
      console.error('admin/orders summary query error:', sErr);
      return json(500, { error: responses.serverError, details: sErr.message });
    }

    const rows = (summaryRows || []) as Array<{ total: number | string; payment_status: string }>;
    const paid = rows.filter((r) => r.payment_status === 'completed');
    const totalRevenue = paid.reduce((acc, r) => acc + Number(r.total || 0), 0);
    const aov = paid.length > 0 ? totalRevenue / paid.length : 0;

    const total = count ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(total / (limit as number)));

    return json(200, {
      orders: orders || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      summary: {
        total_revenue: totalRevenue,
        aov,
        paid_count: paid.length,
        match_count: rows.length,
      },
    });
  } catch (err: any) {
    console.error('admin/orders GET fatal:', err);
    return json(500, { error: responses.serverError, details: err?.message });
  }
}

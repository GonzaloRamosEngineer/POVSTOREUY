'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import OrderFilters, { DEFAULT_FILTERS, OrderFilterState, DatePreset } from './OrderFilters';
import OrderHistoryTable, { HistoryOrder } from './OrderHistoryTable';
import { adminFetch, AdminFetchError } from '@/lib/api/adminFetch';
import { adminOrdersListMessages } from '@/messages/adminOrdersListMessages';
import { ADMIN_CONFIG } from '@/config/admin';

interface ApiResponse {
  orders: HistoryOrder[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
  summary: { total_revenue: number; aov: number; paid_count: number; match_count: number };
}

const VALID_PRESETS: DatePreset[] = ['today', 'last7', 'last30', 'last90', 'thisYear', 'all', 'custom'];

function toCurrency(n: number) {
  return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function filtersToParams(f: OrderFilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.from) sp.set('from', f.from);
  if (f.to) sp.set('to', f.to);
  if (f.datePreset !== 'all') sp.set('preset', f.datePreset);
  if (f.status.length) sp.set('status', f.status.join(','));
  if (f.paymentMethod.length) sp.set('payment_method', f.paymentMethod.join(','));
  if (f.paymentStatus.length) sp.set('payment_status', f.paymentStatus.join(','));
  if (f.department) sp.set('department', f.department);
  if (f.minTotal) sp.set('min_total', f.minTotal);
  if (f.maxTotal) sp.set('max_total', f.maxTotal);
  // excludeTest viene con default = true. Solo escribimos en URL cuando el user lo destildó.
  if (!f.excludeTest) sp.set('exclude_test', 'false');
  if (f.onlyStale) sp.set('stale_days', String(ADMIN_CONFIG.ordersList.staleDefaultDays));
  if (f.sort !== 'created_at:desc') sp.set('sort', f.sort);
  if (f.page > 1) sp.set('page', String(f.page));
  if (f.limit !== ADMIN_CONFIG.ordersList.defaultPageSize) sp.set('limit', String(f.limit));
  return sp;
}

function paramsToFilters(sp: URLSearchParams): OrderFilterState {
  const preset = (sp.get('preset') || 'all') as DatePreset;
  const datePreset: DatePreset = VALID_PRESETS.includes(preset) ? preset : 'all';
  const pageRaw = Number(sp.get('page') || '1');
  const limitRaw = Number(sp.get('limit') || ADMIN_CONFIG.ordersList.defaultPageSize);
  return {
    q: sp.get('q') || '',
    datePreset,
    from: sp.get('from') || '',
    to: sp.get('to') || '',
    status: (sp.get('status') || '').split(',').filter(Boolean),
    paymentMethod: (sp.get('payment_method') || '').split(',').filter(Boolean),
    paymentStatus: (sp.get('payment_status') || '').split(',').filter(Boolean),
    department: sp.get('department') || '',
    minTotal: sp.get('min_total') || '',
    maxTotal: sp.get('max_total') || '',
    // Default true: solo el override explícito 'false' lo desactiva.
    excludeTest: sp.get('exclude_test') !== 'false',
    onlyStale: Boolean(sp.get('stale_days')),
    sort: sp.get('sort') || 'created_at:desc',
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : ADMIN_CONFIG.ordersList.defaultPageSize,
  };
}

/** Construye los query params para el endpoint /api/admin/orders */
function filtersToApiQuery(f: OrderFilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.from) sp.set('from', `${f.from}T00:00:00.000Z`);
  if (f.to) sp.set('to', `${f.to}T23:59:59.999Z`);
  if (f.status.length) sp.set('status', f.status.join(','));
  if (f.paymentMethod.length) sp.set('payment_method', f.paymentMethod.join(','));
  if (f.paymentStatus.length) sp.set('payment_status', f.paymentStatus.join(','));
  if (f.department) sp.set('department', f.department);
  if (f.minTotal) sp.set('min_total', f.minTotal);
  if (f.maxTotal) sp.set('max_total', f.maxTotal);
  if (f.excludeTest) sp.set('exclude_test', 'true');
  if (f.onlyStale) sp.set('stale_days', String(ADMIN_CONFIG.ordersList.staleDefaultDays));
  sp.set('sort', f.sort);
  sp.set('page', String(f.page));
  sp.set('limit', String(f.limit));
  return sp;
}

export default function OrderHistorySection() {
  const { ui, fetchError } = useMemo(
    () => ({ ui: adminOrdersListMessages.ui, fetchError: adminOrdersListMessages.ui.fetchError }),
    []
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado inicial: leer de la URL
  const initialParams = new URLSearchParams(searchParams?.toString() || '');
  const [filters, setFilters] = useState<OrderFilterState>(() => paramsToFilters(initialParams));
  const [isOpen, setIsOpen] = useState<boolean>(() => initialParams.get('history_open') === '1');
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: filters.limit, total: 0, total_pages: 1 });
  const [summary, setSummary] = useState({ total_revenue: 0, aov: 0, paid_count: 0, match_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar URL en cada cambio de filtros o de apertura (sin scroll, sin agregar al history)
  const lastUrlRef = useRef<string>('');
  useEffect(() => {
    const sp = filtersToParams(filters);
    if (isOpen) sp.set('history_open', '1');
    const qs = sp.toString();
    if (qs === lastUrlRef.current) return;
    lastUrlRef.current = qs;
    const url = qs ? `?${qs}` : window.location.pathname;
    router.replace(url, { scroll: false });
  }, [filters, isOpen, router]);

  // Fetch al endpoint (sólo cuando la sección está abierta)
  const fetchOrders = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const qs = filtersToApiQuery(filters).toString();
      const data = await adminFetch<ApiResponse>(`/api/admin/orders?${qs}`);
      setOrders(data.orders || []);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      const msg =
        err instanceof AdminFetchError ? err.message : fetchError;
      setError(msg);
      setOrders([]);
      setPagination({ page: 1, limit: filters.limit, total: 0, total_pages: 1 });
      setSummary({ total_revenue: 0, aov: 0, paid_count: 0, match_count: 0 });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isOpen]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClear = () => setFilters({ ...DEFAULT_FILTERS });
  const goPage = (p: number) => setFilters((f) => ({ ...f, page: Math.max(1, Math.min(p, pagination.total_pages)) }));

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 card-elevation border border-border space-y-4">
      {/* Header: clickeable para colapsar/expandir */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-3 text-left flex-1 group"
          aria-expanded={isOpen}
          aria-controls="order-history-content"
        >
          <Icon
            name={isOpen ? 'ChevronDownIcon' : 'ChevronRightIcon'}
            size={18}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {ui.sectionTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{ui.sectionDescription}</p>
          </div>
        </button>
        {isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchOrders();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted active:scale-95 disabled:opacity-50"
          >
            <Icon name="ArrowPathIcon" size={14} className={`text-primary ${loading ? 'animate-spin' : ''}`} />
            {loading ? ui.refreshing : ui.refresh}
          </button>
        )}
      </div>

      {/* Contenido colapsable */}
      {isOpen && (
        <div id="order-history-content" className="space-y-4">
          <OrderFilters
            value={filters}
            onChange={setFilters}
            onClear={handleClear}
            totalMatches={summary.match_count}
          />

          {/* Chips de resumen */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-muted text-foreground font-bold">
              {ui.summary.count(pagination.total)}
            </span>
            <span className="px-2 py-1 rounded-full bg-success/10 text-success font-bold">
              {ui.summary.total(toCurrency(summary.total_revenue))} ({summary.paid_count} pagadas)
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-bold">
              {ui.summary.aov(toCurrency(summary.aov))}
            </span>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <OrderHistoryTable
            orders={orders}
            loading={loading}
            onRefresh={fetchOrders}
            emptyLabel={ui.empty}
          />

          {/* Paginación */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {ui.pagination.page(pagination.page, pagination.total_pages)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => goPage(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="ChevronLeftIcon" size={14} className="inline mr-1" />
                  {ui.pagination.prev}
                </button>
                <button
                  onClick={() => goPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages || loading}
                  className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {ui.pagination.next}
                  <Icon name="ChevronRightIcon" size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

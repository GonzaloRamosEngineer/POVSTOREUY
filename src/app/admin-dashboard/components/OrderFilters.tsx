'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { adminOrdersListMessages } from '@/messages/adminOrdersListMessages';
import { ADMIN_CONFIG } from '@/config/admin';

export type DatePreset = 'today' | 'last7' | 'last30' | 'last90' | 'thisYear' | 'all' | 'custom';

export interface OrderFilterState {
  q: string;
  datePreset: DatePreset;
  from: string; // YYYY-MM-DD
  to: string;
  status: string[];
  paymentMethod: string[];
  paymentStatus: string[];
  department: string;
  minTotal: string;
  maxTotal: string;
  excludeTest: boolean;
  onlyStale: boolean;
  sort: string;
  page: number;
  limit: number;
}

export const DEFAULT_FILTERS: OrderFilterState = {
  q: '',
  datePreset: 'all',
  from: '',
  to: '',
  status: [],
  paymentMethod: [],
  paymentStatus: [],
  department: '',
  minTotal: '',
  maxTotal: '',
  excludeTest: true,
  onlyStale: false,
  sort: 'created_at:desc',
  page: 1,
  limit: ADMIN_CONFIG.ordersList.defaultPageSize,
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'En proceso' },
  { value: 'ready', label: 'Listo' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
] as const;

const METHOD_OPTIONS = [
  { value: 'mercadopago', label: 'MercadoPago' },
  { value: 'bank_transfer', label: 'Transferencia' },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Pagado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'refunded', label: 'Reintegrado' },
] as const;

const DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
] as const;

function computePresetDates(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const today0 = startOfDay(today);

  switch (preset) {
    case 'today':
      return { from: toIso(today0), to: toIso(today0) };
    case 'last7': {
      const from = new Date(today0);
      from.setDate(today0.getDate() - 6);
      return { from: toIso(from), to: toIso(today0) };
    }
    case 'last30': {
      const from = new Date(today0);
      from.setDate(today0.getDate() - 29);
      return { from: toIso(from), to: toIso(today0) };
    }
    case 'last90': {
      const from = new Date(today0);
      from.setDate(today0.getDate() - 89);
      return { from: toIso(from), to: toIso(today0) };
    }
    case 'thisYear': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toIso(from), to: toIso(today0) };
    }
    case 'all':
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}

interface Props {
  value: OrderFilterState;
  onChange: (next: OrderFilterState) => void;
  onClear: () => void;
  totalMatches: number;
}

function toggleInArray(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function OrderFilters({ value, onChange, onClear, totalMatches }: Props) {
  const { ui } = adminOrdersListMessages;
  const [localQ, setLocalQ] = useState(value.q);
  const [expanded, setExpanded] = useState(true);

  // Debounce del search: 300ms
  useEffect(() => {
    if (localQ === value.q) return;
    const t = setTimeout(() => {
      onChange({ ...value, q: localQ, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ]);

  useEffect(() => {
    if (value.q !== localQ) setLocalQ(value.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.q]);

  const updatePreset = (preset: DatePreset) => {
    const { from, to } = computePresetDates(preset);
    onChange({ ...value, datePreset: preset, from, to, page: 1 });
  };

  const updateCustomDate = (field: 'from' | 'to', v: string) => {
    onChange({ ...value, datePreset: 'custom', [field]: v, page: 1 });
  };

  const toggleStatus = (v: string) =>
    onChange({ ...value, status: toggleInArray(value.status, v), page: 1 });
  const toggleMethod = (v: string) =>
    onChange({ ...value, paymentMethod: toggleInArray(value.paymentMethod, v), page: 1 });
  const togglePaymentStatus = (v: string) =>
    onChange({ ...value, paymentStatus: toggleInArray(value.paymentStatus, v), page: 1 });

  const chipBase =
    'px-3 py-1 rounded-full text-[11px] font-bold uppercase border transition-colors';
  const chipOn = 'bg-primary text-primary-foreground border-primary';
  const chipOff = 'bg-card text-foreground border-border hover:border-primary/50';

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header: search + toggle expandir */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Icon
            name="MagnifyingGlassIcon"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder={ui.filters.search}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted"
        >
          <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
          {expanded ? ui.hideFilters : ui.showFilters}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted text-muted-foreground"
        >
          {ui.clear}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Período */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
              {ui.filters.datePreset}
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ui.filters.datePresets) as DatePreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updatePreset(p)}
                  className={`${chipBase} ${value.datePreset === p ? chipOn : chipOff}`}
                >
                  {ui.filters.datePresets[p as keyof typeof ui.filters.datePresets]}
                </button>
              ))}
            </div>
            {(value.datePreset === 'custom' ||
              value.datePreset === 'today' ||
              value.from ||
              value.to) && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    {ui.filters.from}
                  </label>
                  <input
                    type="date"
                    value={value.from}
                    onChange={(e) => updateCustomDate('from', e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    {ui.filters.to}
                  </label>
                  <input
                    type="date"
                    value={value.to}
                    onChange={(e) => updateCustomDate('to', e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estado de orden */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
              {ui.filters.status}
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleStatus(opt.value)}
                  className={`${chipBase} ${value.status.includes(opt.value) ? chipOn : chipOff}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Método y estado de pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
                {ui.filters.paymentMethod}
              </label>
              <div className="flex flex-wrap gap-2">
                {METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMethod(opt.value)}
                    className={`${chipBase} ${value.paymentMethod.includes(opt.value) ? chipOn : chipOff}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
                {ui.filters.paymentStatus}
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePaymentStatus(opt.value)}
                    className={`${chipBase} ${value.paymentStatus.includes(opt.value) ? chipOn : chipOff}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Departamento + montos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">
                {ui.filters.department}
              </label>
              <select
                value={value.department}
                onChange={(e) => onChange({ ...value, department: e.target.value, page: 1 })}
                className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
              >
                <option value="">—</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">
                {ui.filters.minTotal}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value.minTotal}
                onChange={(e) => onChange({ ...value, minTotal: e.target.value, page: 1 })}
                className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">
                {ui.filters.maxTotal}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value.maxTotal}
                onChange={(e) => onChange({ ...value, maxTotal: e.target.value, page: 1 })}
                className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
                placeholder="∞"
              />
            </div>
          </div>

          {/* Toggles + sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-2 border-t border-border">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.excludeTest}
                  onChange={(e) => onChange({ ...value, excludeTest: e.target.checked, page: 1 })}
                  className="w-4 h-4 rounded border-border"
                />
                {ui.filters.excludeTest}
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.onlyStale}
                  onChange={(e) => onChange({ ...value, onlyStale: e.target.checked, page: 1 })}
                  className="w-4 h-4 rounded border-border"
                />
                {ui.filters.onlyStale(ADMIN_CONFIG.ordersList.staleDefaultDays)}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Orden:</span>
              <select
                value={value.sort}
                onChange={(e) => onChange({ ...value, sort: e.target.value, page: 1 })}
                className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
              >
                <option value="created_at:desc">Fecha (más reciente)</option>
                <option value="created_at:asc">Fecha (más antigua)</option>
                <option value="total:desc">Monto (mayor)</option>
                <option value="total:asc">Monto (menor)</option>
                <option value="order_number:desc">N° (Z→A)</option>
                <option value="order_number:asc">N° (A→Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Hint de matches */}
      <div className="text-[11px] text-muted-foreground">
        {ui.summary.count(totalMatches)} en filtro actual.
      </div>
    </div>
  );
}

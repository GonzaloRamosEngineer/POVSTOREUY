'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import OrderDetailsModal from './OrderDetailsModal';

export interface HistoryOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string | null;
  shipping_department: string | null;
  total: number | string;
  order_status: 'pending' | 'completed' | 'processing' | 'cancelled' | 'ready' | 'shipped';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  tracking_number?: string | null;
}

interface Props {
  orders: HistoryOrder[];
  loading: boolean;
  onRefresh: () => Promise<void> | void;
  emptyLabel: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function openWhatsApp(phone: string) {
  let n = (phone || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = n.substring(1);
  if (!n.startsWith('598')) n = '598' + n;
  if (n.length < 6) return;
  window.open(`https://wa.me/${n}`, '_blank');
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  processing: 'bg-accent/10 text-accent',
  ready: 'bg-purple-500/10 text-purple-600',
  shipped: 'bg-blue-500/10 text-blue-600',
  pending: 'bg-warning/10 text-warning',
  cancelled: 'bg-error/10 text-error',
};

function paymentDisplay(status: string) {
  switch (status) {
    case 'completed':
      return { text: 'PAGADO', color: 'text-success' };
    case 'failed':
      return { text: 'FALLIDO', color: 'text-error' };
    case 'refunded':
      return { text: 'REINTEGRADO', color: 'text-muted-foreground' };
    case 'pending':
    default:
      return { text: 'PENDIENTE', color: 'text-warning' };
  }
}

export default function OrderHistoryTable({ orders, loading, onRefresh, emptyLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6 bg-card animate-pulse space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-border rounded-xl p-8 bg-card text-center">
        <Icon name="InboxIcon" size={28} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto border border-border rounded-xl bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-medium bg-muted/20">
              <th className="py-3 px-4 text-left">Pedido</th>
              <th className="py-3 px-4 text-left">Fecha</th>
              <th className="py-3 px-4 text-left">Cliente</th>
              <th className="py-3 px-4 text-left">Dept.</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Pago</th>
              <th className="py-3 px-4 text-right">Monto</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => {
              const pd = paymentDisplay(o.payment_status);
              const isPickup = !o.shipping_address;
              return (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    #{o.order_number}
                    {isPickup && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[8px] font-black uppercase">
                        <Icon name="BuildingStorefrontIcon" size={10} />
                        Retiro
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{o.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground">{o.customer_email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-foreground">{o.shipping_department || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                        STATUS_COLORS[o.order_status] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {o.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-foreground">
                        {o.payment_method === 'mercadopago' ? 'MP' : 'Transfer.'}
                      </span>
                      <span className={`text-[9px] font-black ${pd.color}`}>{pd.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-primary whitespace-nowrap">
                    ${Number(o.total).toLocaleString('es-UY')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setSelected(o.order_number)}
                        className="p-1.5 hover:bg-muted rounded-lg text-primary transition-colors"
                        title="Ver detalles"
                      >
                        <Icon name="EyeIcon" size={16} />
                      </button>
                      <button
                        onClick={() => openWhatsApp(o.customer_phone)}
                        className="p-1.5 hover:bg-success/10 rounded-lg text-success transition-colors"
                        title="WhatsApp"
                      >
                        <Icon name="ChatBubbleLeftRightIcon" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {orders.map((o) => {
          const pd = paymentDisplay(o.payment_status);
          return (
            <div
              key={o.id}
              onClick={() => setSelected(o.order_number)}
              className="bg-card border border-border rounded-xl p-3 active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    #{o.order_number} · {formatDate(o.created_at)}
                  </span>
                  <span className="font-bold text-foreground">{o.customer_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {o.shipping_department || '—'}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                    STATUS_COLORS[o.order_status] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {o.order_status}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className={`text-[10px] font-black ${pd.color}`}>
                  {o.payment_method === 'mercadopago' ? 'MP' : 'Transfer.'} · {pd.text}
                </span>
                <span className="text-sm font-black text-primary">
                  ${Number(o.total).toLocaleString('es-UY')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <OrderDetailsModal
          orderId={selected}
          isOpen={true}
          onClose={() => {
            setSelected(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import OrderDetailsModal from './OrderDetailsModal';

interface Order {
  id: string; 
  order_number: string; 
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  order_status: 'pending' | 'completed' | 'processing' | 'cancelled' | 'ready' | 'shipped';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface OrdersTableProps {
  orders: Order[];
  onRefresh?: () => Promise<void>;
}

export default function OrdersTable({ orders, onRefresh }: OrdersTableProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (typeof onRefresh !== 'function') return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.error('Error al refrescar:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleViewDetails = (orderNumber: string) => {
    setSelectedOrderId(orderNumber);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-success/10 text-success',
      processing: 'bg-accent/10 text-accent',
      ready: 'bg-purple-500/10 text-purple-600',
      shipped: 'bg-blue-500/10 text-blue-600',
      pending: 'bg-warning/10 text-warning',
      cancelled: 'bg-error/10 text-error',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Header con Botón de Refresh */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-bold text-foreground">Pedidos Recientes</h2>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted border border-border rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Icon name="ArrowPathIcon" size={14} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* --- VISTA DESKTOP: TABLA --- */}
      <div className="hidden lg:block overflow-x-auto border border-border rounded-xl bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-medium bg-muted/20">
              <th className="py-4 px-4 text-left">Pedido</th>
              <th className="py-4 px-4 text-left">Cliente</th>
              <th className="py-4 px-4 text-left">Estado</th>
              <th className="py-4 px-4 text-left">Pago</th>
              <th className="py-4 px-4 text-right">Monto</th>
              <th className="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-mono font-bold text-foreground">#{order.order_number}</td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{order.customer_name}</span>
                    <span className="text-[10px] text-muted-foreground">{order.customer_email}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-foreground">{order.payment_method}</span>
                    <span className={`text-[9px] font-black underline ${order.payment_status === 'completed' ? 'text-success' : 'text-warning'}`}>
                      {order.payment_status === 'completed' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-black text-primary">${Number(order.total).toLocaleString('es-UY')}</td>
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleViewDetails(order.order_number)} className="p-2 hover:bg-muted rounded-lg text-primary transition-colors">
                      <Icon name="EyeIcon" size={18} />
                    </button>
                    <button 
                      onClick={() => window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`, '_blank')}
                      className="p-2 hover:bg-success/10 rounded-lg text-success transition-colors"
                    >
                      <Icon name="ChatBubbleLeftRightIcon" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- VISTA MOBILE: CARDS (ZOOM EFECTO) --- */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {orders.map((order) => (
          <div 
            key={order.id} 
            onClick={() => handleViewDetails(order.order_number)}
            className="bg-card border border-border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all duration-200 hover:border-primary/30"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">#{order.order_number}</span>
                <span className="font-bold text-foreground">{order.customer_name}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(order.order_status)}`}>
                {order.order_status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 mt-3">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Pago ({order.payment_method})</p>
                <p className={`text-xs font-black ${order.payment_status === 'completed' ? 'text-success' : 'text-warning'}`}>
                  {order.payment_status === 'completed' ? 'PAGADO' : 'PENDIENTE'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Monto Total</p>
                <p className="text-sm font-black text-primary">${Number(order.total).toLocaleString('es-UY')}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                <Icon name="EyeIcon" size={14} /> Detalles
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`, '_blank');
                }}
                className="px-4 py-2 bg-[#25D366] text-white rounded-lg flex items-center justify-center"
              >
                <Icon name="ChatBubbleLeftRightIcon" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Gestión */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrderId(null);
          }}
        />
      )}
    </div>
  );
}
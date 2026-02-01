'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import OrderDetailsModal from './OrderDetailsModal';

// Interfaz para los datos que vienen de la base de datos
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
  onRefresh?: () => Promise<void>; // ✅ Ahora es opcional con el "?"
}

export default function OrdersTable({ orders, onRefresh }: OrdersTableProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    // ✅ Verificamos si la función existe antes de llamarla para evitar el crash
    if (typeof onRefresh !== 'function') {
      console.warn('La prop onRefresh no fue proporcionada al OrdersTable');
      return;
    }

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.error('Error al refrescar:', err);
    } finally {
      // Pequeño delay para suavizar la animación del icono
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
      {/* Cabecera con botón de refresco */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-bold text-foreground">Pedidos Recientes</h2>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Icon 
            name="ArrowPathIcon" 
            size={14} 
            className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
          />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

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
                <td className="py-4 px-4 font-mono font-bold text-foreground">
                  #{order.order_number}
                </td>
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
                    <span className={`text-[9px] font-black underline ${
                      order.payment_status === 'completed' ? 'text-success' : 'text-warning'
                    }`}>
                      {order.payment_status === 'completed' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-black text-primary">
                  ${Number(order.total).toLocaleString('es-UY')}
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => handleViewDetails(order.order_number)} 
                      className="p-2 hover:bg-muted rounded-lg text-primary transition-colors"
                    >
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
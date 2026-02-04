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
  shipping_address: string;
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

  // Función robusta para formatear el número para WhatsApp (Uruguay 598)
  const openWhatsApp = (phone: string) => {
    let cleanNumber = phone.replace(/\D/g, ''); // Limpia todo lo que no sea número
    
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1); // Quita el 0 inicial (098 -> 98)
    }
    
    if (!cleanNumber.startsWith('598')) {
      cleanNumber = '598' + cleanNumber; // Agrega el código de Uruguay si no está
    }
    
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

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

  // Helper para detectar si es retiro
  const isPickup = (order: Order) => !order.shipping_address;

  // ✅ NUEVO: Helper para obtener el texto y color del estado de pago
  const getPaymentStatusDisplay = (status: 'pending' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return { text: 'PAGADO', color: 'text-success' };
      case 'failed':
        return { text: 'FALLIDO', color: 'text-error' };
      case 'pending':
      default:
        return { text: 'PENDIENTE', color: 'text-warning' };
    }
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
      <div className="hidden lg:block overflow-x-auto border border-border rounded-xl bg-card text-foreground">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-medium bg-muted/20">
              <th className="py-4 px-4 text-left">Pedido</th>
              <th className="py-4 px-4 text-left">Cliente</th>
              <th className="py-4 px-4 text-left">Estado</th>
              <th className="py-4 px-4 text-left">Entrega</th>
              <th className="py-4 px-4 text-left">Pago</th>
              <th className="py-4 px-4 text-right">Monto</th>
              <th className="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const paymentDisplay = getPaymentStatusDisplay(order.payment_status);
              
              return (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold">#{order.order_number}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col text-foreground">
                      <span className="font-bold">{order.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground">{order.customer_email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {isPickup(order) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black uppercase">
                        <Icon name="BuildingStorefrontIcon" size={12} />
                        Retiro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black uppercase">
                        <Icon name="TruckIcon" size={12} />
                        Envío
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1 text-foreground">
                      <span className="text-[10px] font-bold uppercase">{order.payment_method}</span>
                      {/* ✅ CORREGIDO: Muestra correctamente los 3 estados */}
                      <span className={`text-[9px] font-black underline ${paymentDisplay.color}`}>
                        {paymentDisplay.text}
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
                        onClick={() => openWhatsApp(order.customer_phone)}
                        className="p-2 hover:bg-success/10 rounded-lg text-success transition-colors"
                      >
                        <Icon name="ChatBubbleLeftRightIcon" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- VISTA MOBILE: CARDS --- */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {orders.map((order) => {
          const paymentDisplay = getPaymentStatusDisplay(order.payment_status);
          
          return (
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
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                  {isPickup(order) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full text-[8px] font-black uppercase">
                      <Icon name="BuildingStorefrontIcon" size={10} />
                      Retiro
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[8px] font-black uppercase">
                      <Icon name="TruckIcon" size={10} />
                      Envío
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 mt-3">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Pago ({order.payment_method})</p>
                  {/* ✅ CORREGIDO: Muestra correctamente los 3 estados en mobile */}
                  <p className={`text-xs font-black ${paymentDisplay.color}`}>
                    {paymentDisplay.text}
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
                    openWhatsApp(order.customer_phone);
                  }}
                  className="px-4 py-2 bg-[#25D366] text-white rounded-lg flex items-center justify-center shadow-md active:scale-95"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={16} />
                </button>
              </div>
            </div>
          );
        })}
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
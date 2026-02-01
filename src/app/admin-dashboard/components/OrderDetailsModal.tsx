'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_model: string;
  product_image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  order_status: string;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  mp_status: string | null;
  mp_status_detail: string | null;
  tracking_number?: string | null;
  items?: OrderItem[];
}

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    if (isOpen && orderId) fetchOrderDetails();
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      setOrderDetails(data);
      setTrackingInput(data.tracking_number || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, tracking_number: trackingInput }),
      });
      if (response.ok) await fetchOrderDetails();
    } catch (err) {
      alert('Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const getPreviousStatus = (status: string) => {
    const steps: Record<string, string> = { processing: 'pending', ready: 'processing', shipped: 'ready', completed: 'shipped' };
    return steps[status] || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl flex flex-col border border-border overflow-hidden max-h-[96vh]">
        
        {/* Header con ID resaltado */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-tighter">Panel de Gestión</h2>
            {orderDetails && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono">#{orderDetails.order_number}</span>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors"><Icon name="XMarkIcon" size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : orderDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Izquierda: Operaciones */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* ACCIONES DE DESPACHO */}
                <div className="bg-card border-2 border-primary/10 rounded-2xl p-5 shadow-sm relative">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xs font-black text-primary uppercase flex items-center gap-2">
                      <Icon name="ClipboardDocumentCheckIcon" size={16} /> Flujo Operativo
                    </h3>
                    {getPreviousStatus(orderDetails.order_status) && (
                      <button onClick={() => handleUpdateOrder(getPreviousStatus(orderDetails.order_status)!)} className="text-[9px] font-bold text-muted-foreground hover:text-error uppercase flex items-center gap-1">
                        <Icon name="ArrowUturnLeftIcon" size={10} /> Volver a {getPreviousStatus(orderDetails.order_status)}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {orderDetails.order_status === 'pending' && (
                      <button onClick={() => handleUpdateOrder('processing')} className="flex-1 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform">Procesar Pedido</button>
                    )}
                    {orderDetails.order_status === 'processing' && (
                      <button onClick={() => handleUpdateOrder('ready')} className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform">Listo para Envío</button>
                    )}
                    {(orderDetails.order_status === 'ready' || orderDetails.order_status === 'shipped') && (
                      <div className="flex flex-1 gap-2 min-w-[300px]">
                        <input type="text" className="flex-1 p-3 border-2 border-muted rounded-xl text-xs bg-background focus:border-primary outline-none" placeholder="Nro Tracking (UES, Mirtrans...)" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} />
                        <button onClick={() => handleUpdateOrder('shipped')} disabled={!trackingInput} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50">Despachar</button>
                      </div>
                    )}
                    {orderDetails.order_status === 'shipped' && (
                      <button onClick={() => handleUpdateOrder('completed')} className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase">Confirmar Entrega</button>
                    )}
                  </div>
                </div>

                {/* PRODUCTOS */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/20 border-b border-border text-[10px] font-black uppercase">Artículos del Pedido</div>
                  <div className="divide-y divide-border">
                    {orderDetails.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <img src={item.product_image_url} className="w-12 h-12 object-cover rounded-lg border border-border" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate">{item.product_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">CANTIDAD: {item.quantity} • UNIT: ${Number(item.unit_price).toLocaleString('es-UY')}</p>
                        </div>
                        <p className="text-sm font-black text-primary">${Number(item.total_price).toLocaleString('es-UY')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Información de Referencia */}
              <div className="lg:col-span-4 space-y-6">
                {/* Resumen de Pago */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex justify-between items-baseline border-b border-border pb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Total Pedido</span>
                    <span className="text-2xl font-black text-primary">${Number(orderDetails.total).toLocaleString('es-UY')}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">Estado del Pago</p>
                    <div className={`p-2 rounded-lg border flex items-center justify-between ${orderDetails.payment_status === 'completed' ? 'border-success/20 bg-success/5 text-success' : 'border-warning/20 bg-warning/5 text-warning'}`}>
                      <span className="text-[10px] font-black uppercase">{orderDetails.payment_status === 'completed' ? 'Pagado' : 'Pendiente'}</span>
                      <Icon name={orderDetails.payment_status === 'completed' ? 'CheckCircleIcon' : 'ClockIcon'} size={14} />
                    </div>
                  </div>
                </div>

                {/* Datos de Contacto */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <section>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">Comprador</h4>
                    <p className="text-xs font-black leading-tight">{orderDetails.customer_name}</p>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted/30 rounded-lg border border-border">
                      <Icon name="PhoneIcon" size={14} className="text-primary" />
                      <span className="text-xs font-mono font-bold">{orderDetails.customer_phone}</span>
                    </div>
                  </section>
                  <section className="pt-4 border-t border-border">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">Envío</h4>
                    <p className="text-[10px] font-bold leading-relaxed">{orderDetails.shipping_address || 'RETIRO EN LOCAL'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1">{orderDetails.shipping_city}, {orderDetails.shipping_department}</p>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con WhatsApp Directo */}
        <div className="p-4 border-t border-border bg-card/80 flex justify-between items-center">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase border border-border rounded-xl hover:bg-muted transition-colors">Cerrar</button>
          {orderDetails && (
            <button 
              onClick={() => window.open(`https://wa.me/${orderDetails.customer_phone.replace(/\D/g, '')}`, '_blank')}
              className="px-6 py-2 bg-[#25D366] text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={16} /> WhatsApp Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
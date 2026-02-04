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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  // ✅ Función de "magia" para WhatsApp en Uruguay
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

  // ✅ Función para actualizar estado de pago
  const handleUpdatePaymentStatus = async (newPaymentStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });
      if (response.ok) {
        await fetchOrderDetails();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        alert(err.error || 'Error al actualizar estado de pago');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar estado de pago');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ NUEVO: Función para cancelar orden (solo transferencias)
  const handleCancelOrder = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancel_payment: true // Flag para que el backend cancele también el pago
        }),
      });
      
      if (response.ok) {
        await fetchOrderDetails();
        setShowCancelConfirm(false);
        alert('Orden cancelada exitosamente');
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        alert(err.error || 'Error al cancelar la orden');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cancelar la orden');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Función que arma el payload dinámicamente según tipo de entrega
  const handleUpdateOrder = async (newStatus: string, newTracking?: string) => {
    setUpdating(true);
    try {
      const isPickup = !!orderDetails && !orderDetails.shipping_address;

      // ✅ Construir payload dinámicamente
      const payload: any = { status: newStatus };

      // ✅ Solo incluir tracking_number si NO es retiro Y hay un valor
      if (!isPickup) {
        const trackingValue = (newTracking ?? trackingInput).trim();
        if (trackingValue) {
          payload.tracking_number = trackingValue;
        }
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchOrderDetails();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        alert(err.error || 'Error al actualizar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const getPreviousStatus = (status: string) => {
    const isPickup = !orderDetails?.shipping_address;
    
    if (isPickup) {
      // Flujo de retiro: pending → processing → ready → completed
      const pickupSteps: Record<string, string> = { 
        processing: 'pending', 
        ready: 'processing', 
        completed: 'ready' 
      };
      return pickupSteps[status] || null;
    } else {
      // Flujo de envío: pending → processing → ready → shipped → completed
      const shippingSteps: Record<string, string> = { 
        processing: 'pending', 
        ready: 'processing', 
        shipped: 'ready', 
        completed: 'shipped' 
      };
      return shippingSteps[status] || null;
    }
  };

  if (!isOpen) return null;

  // ✅ Detectar si es retiro en local
  const isPickup = orderDetails && !orderDetails.shipping_address;
  const isBankTransfer = orderDetails?.payment_method === 'bank_transfer';
  const isCancelled = orderDetails?.order_status === 'cancelled';
  const canCancel = isBankTransfer && !isCancelled && orderDetails?.order_status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl flex flex-col border border-border overflow-hidden max-h-[96vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-tighter text-foreground">Panel de Gestión</h2>
            {orderDetails && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono">#{orderDetails.order_number}</span>
                {/* ✅ Etiqueta de tipo de entrega */}
                {isPickup && (
                  <span className="text-[9px] bg-purple-600/20 text-purple-600 px-2 py-0.5 rounded font-black uppercase">
                    Retiro en Local
                  </span>
                )}
                {/* ✅ NUEVO: Etiqueta de cancelado */}
                {isCancelled && (
                  <span className="text-[9px] bg-error/20 text-error px-2 py-0.5 rounded font-black uppercase">
                    Cancelado
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-foreground"><Icon name="XMarkIcon" size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : orderDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Izquierda: Operaciones */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* ✅ GESTIÓN DE PAGO (solo para transferencias) */}
                {isBankTransfer && !isCancelled && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase flex items-center gap-2">
                        <Icon name="BanknotesIcon" size={16} /> Gestión de Pago (Transferencia)
                      </h3>
                      <span className={`text-[9px] font-black px-2 py-1 rounded ${
                        orderDetails.payment_status === 'completed' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {orderDetails.payment_status === 'completed' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {orderDetails.payment_status !== 'completed' && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus('completed')}
                          disabled={updating}
                          className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Icon name="CheckCircleIcon" size={16} />
                          Marcar como Pagado
                        </button>
                      )}
                      
                      {orderDetails.payment_status === 'completed' && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus('pending')}
                          disabled={updating}
                          className="flex-1 py-3 bg-warning text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Icon name="ClockIcon" size={16} />
                          Revertir a Pendiente
                        </button>
                      )}
                    </div>

                    {orderDetails.payment_status !== 'completed' && (
                      <p className="mt-3 text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-start gap-2">
                        <Icon name="InformationCircleIcon" size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Confirma el pago una vez verificada la transferencia bancaria.</span>
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ NUEVO: Zona de cancelación para transferencias */}
                {canCancel && (
                  <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase flex items-center gap-2">
                        <Icon name="ExclamationTriangleIcon" size={16} /> Cancelar Orden
                      </h3>
                    </div>

                    {!showCancelConfirm ? (
                      <>
                        <p className="text-[10px] text-red-700 dark:text-red-400 mb-3">
                          Esta acción cancelará la orden y marcará el pago como fallido. Solo disponible para transferencias bancarias.
                        </p>
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={updating}
                          className="w-full py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Icon name="XCircleIcon" size={16} />
                          Cancelar Esta Orden
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-red-700 dark:text-red-400 mb-3 font-bold">
                          ⚠️ ¿Estás seguro? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={updating}
                            className="flex-1 py-3 bg-muted text-foreground rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                          >
                            No, volver
                          </button>
                          <button 
                            onClick={handleCancelOrder}
                            disabled={updating}
                            className="flex-1 py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Icon name="CheckIcon" size={16} />
                            Sí, Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ACCIONES DE DESPACHO */}
                {!isCancelled && (
                  <div className="bg-card border-2 border-primary/10 rounded-2xl p-5 shadow-sm relative">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-xs font-black text-primary uppercase flex items-center gap-2">
                        <Icon name="ClipboardDocumentCheckIcon" size={16} /> 
                        {isPickup ? 'Flujo de Retiro' : 'Flujo de Envío'}
                      </h3>
                      {getPreviousStatus(orderDetails.order_status) && (
                        <button 
                          onClick={() => handleUpdateOrder(getPreviousStatus(orderDetails.order_status)!)} 
                          disabled={updating}
                          className="text-[9px] font-bold text-muted-foreground hover:text-error uppercase flex items-center gap-1 disabled:opacity-50"
                        >
                          <Icon name="ArrowUturnLeftIcon" size={10} /> Volver a {getPreviousStatus(orderDetails.order_status)}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* PENDING → PROCESSING */}
                      {orderDetails.order_status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateOrder('processing')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          Procesar Pedido
                        </button>
                      )}
                      
                      {/* PROCESSING → READY */}
                      {orderDetails.order_status === 'processing' && (
                        <button 
                          onClick={() => handleUpdateOrder('ready')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          Listo para {isPickup ? 'Retiro' : 'Envío'}
                        </button>
                      )}
                      
                      {/* ✅ Flujo diferenciado según tipo de entrega */}
                      {orderDetails.order_status === 'ready' && (
                        <>
                          {isPickup ? (
                            // Retiro: READY → COMPLETED (sin tracking)
                            <button 
                              onClick={() => handleUpdateOrder('completed')} 
                              disabled={updating}
                              className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                            >
                              Confirmar Retiro
                            </button>
                          ) : (
                            // Envío: READY → SHIPPED (con tracking)
                            <div className="flex flex-1 gap-2 min-w-[300px]">
                              <input 
                                type="text" 
                                className="flex-1 p-3 border-2 border-muted rounded-xl text-xs bg-background focus:border-primary outline-none text-foreground" 
                                placeholder="Nro Tracking (UES, Mirtrans...)" 
                                value={trackingInput} 
                                onChange={(e) => setTrackingInput(e.target.value)} 
                              />
                              <button 
                                onClick={() => handleUpdateOrder('shipped')} 
                                disabled={!trackingInput || updating} 
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 hover:scale-[1.02] transition-transform"
                              >
                                Despachar
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* SHIPPED → COMPLETED (solo para envíos) */}
                      {orderDetails.order_status === 'shipped' && !isPickup && (
                        <button 
                          onClick={() => handleUpdateOrder('completed')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          Confirmar Entrega
                        </button>
                      )}
                    </div>

                    {/* ✅ Indicador visual del flujo según tipo */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Flujo actual:</p>
                      <div className="flex items-center gap-2 text-[9px] font-mono">
                        {isPickup ? (
                          <>
                            <span className={orderDetails.order_status === 'pending' ? 'text-primary font-black' : 'text-muted-foreground'}>PENDING</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'processing' ? 'text-primary font-black' : 'text-muted-foreground'}>PROCESSING</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'ready' ? 'text-primary font-black' : 'text-muted-foreground'}>READY</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'completed' ? 'text-primary font-black' : 'text-muted-foreground'}>COMPLETED</span>
                          </>
                        ) : (
                          <>
                            <span className={orderDetails.order_status === 'pending' ? 'text-primary font-black' : 'text-muted-foreground'}>PENDING</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'processing' ? 'text-primary font-black' : 'text-muted-foreground'}>PROCESSING</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'ready' ? 'text-primary font-black' : 'text-muted-foreground'}>READY</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'shipped' ? 'text-primary font-black' : 'text-muted-foreground'}>SHIPPED</span>
                            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
                            <span className={orderDetails.order_status === 'completed' ? 'text-primary font-black' : 'text-muted-foreground'}>COMPLETED</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ NUEVO: Mensaje si la orden está cancelada */}
                {isCancelled && (
                  <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-8 text-center">
                    <Icon name="XCircleIcon" size={48} className="text-error mx-auto mb-4" />
                    <h3 className="text-lg font-black text-error mb-2">Orden Cancelada</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta orden ha sido cancelada y no se puede procesar.
                    </p>
                  </div>
                )}

                {/* PRODUCTOS */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/20 border-b border-border text-[10px] font-black uppercase text-foreground">Artículos del Pedido</div>
                  <div className="divide-y divide-border">
                    {orderDetails.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <img src={item.product_image_url} className="w-12 h-12 object-cover rounded-lg border border-border" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate text-foreground">{item.product_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase">CANTIDAD: {item.quantity} • UNIT: ${Number(item.unit_price).toLocaleString('es-UY')}</p>
                        </div>
                        <p className="text-sm font-black text-primary">${Number(item.total_price).toLocaleString('es-UY')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Información */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex justify-between items-baseline border-b border-border pb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Total Pedido</span>
                    <span className="text-2xl font-black text-primary">${Number(orderDetails.total).toLocaleString('es-UY')}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">Estado del Pago</p>
                    <div className={`p-2 rounded-lg border flex items-center justify-between ${
                      orderDetails.payment_status === 'completed' 
                        ? 'border-success/20 bg-success/5 text-success' 
                        : orderDetails.payment_status === 'failed'
                        ? 'border-error/20 bg-error/5 text-error'
                        : 'border-warning/20 bg-warning/5 text-warning'
                    }`}>
                      <span className="text-[10px] font-black uppercase">
                        {orderDetails.payment_status === 'completed' ? 'Pagado' : orderDetails.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}
                      </span>
                      <Icon name={
                        orderDetails.payment_status === 'completed' 
                          ? 'CheckCircleIcon' 
                          : orderDetails.payment_status === 'failed'
                          ? 'XCircleIcon'
                          : 'ClockIcon'
                      } size={14} />
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 space-y-4 text-foreground">
                  <section>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">Comprador</h4>
                    <p className="text-xs font-black leading-tight">{orderDetails.customer_name}</p>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted/30 rounded-lg border border-border">
                      <Icon name="PhoneIcon" size={14} className="text-primary" />
                      <span className="text-xs font-mono font-bold">{orderDetails.customer_phone}</span>
                    </div>
                  </section>
                  <section className="pt-4 border-t border-border">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">
                      {isPickup ? 'Retiro en Local' : 'Envío'}
                    </h4>
                    {isPickup ? (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase flex items-center gap-2">
                          <Icon name="BuildingStorefrontIcon" size={14} />
                          El cliente retira en local
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold leading-relaxed">{orderDetails.shipping_address}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">{orderDetails.shipping_city}, {orderDetails.shipping_department}</p>
                        {orderDetails.tracking_number && (
                          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Tracking</p>
                            <p className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">{orderDetails.tracking_number}</p>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/80 flex justify-between items-center">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase border border-border rounded-xl hover:bg-muted transition-colors text-foreground">Cerrar</button>
          {orderDetails && (
            <button 
              onClick={() => openWhatsApp(orderDetails.customer_phone)}
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
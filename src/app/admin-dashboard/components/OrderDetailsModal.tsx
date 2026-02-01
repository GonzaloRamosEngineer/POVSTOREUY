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

  // ✅ Función robusta para formatear el número para WhatsApp
  const openWhatsApp = (phone: string) => {
    // 1. Eliminar todo lo que no sea un número (espacios, guiones, paréntesis)
    let cleanNumber = phone.replace(/\D/g, '');
    
    // 2. Si el número empieza con '0', quitarlo (ej: 098... -> 98...)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // 3. Si no tiene el código de país de Uruguay (598), agregarlo
    if (!cleanNumber.startsWith('598')) {
      cleanNumber = '598' + cleanNumber;
    }
    
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  // ... (useEffect, fetchOrderDetails y handleUpdateOrder se mantienen igual)

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl flex flex-col border border-border overflow-hidden max-h-[96vh]">
        
        {/* Header */}
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
                {/* ... (ACCIONES DE DESPACHO Y PRODUCTOS se mantienen igual) */}
              </div>

              {/* Columna Derecha: Información de Referencia */}
              <div className="lg:col-span-4 space-y-6">
                {/* Resumen de Pago */}
                {/* ... (Se mantiene igual) */}

                {/* Datos de Contacto */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <section>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">Comprador</h4>
                    <p className="text-xs font-black leading-tight">{orderDetails.customer_name}</p>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted/30 rounded-lg border border-border">
                      <Icon name="PhoneIcon" size={14} className="text-primary" />
                      {/* Mostramos el número tal cual está en DB para visualización */}
                      <span className="text-xs font-mono font-bold">{orderDetails.customer_phone}</span>
                    </div>
                  </section>
                  {/* ... (Sección de Envío se mantiene igual) */}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con WhatsApp Directo usando la nueva función */}
        <div className="p-4 border-t border-border bg-card/80 flex justify-between items-center">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase border border-border rounded-xl hover:bg-muted transition-colors">Cerrar</button>
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
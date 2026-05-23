'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL TOAST Y NUESTRO DICCIONARIO
import { toast } from 'react-hot-toast';
import { adminOrderMessages } from '@/messages/adminOrderMessages';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { isPickup, type DeliveryMethod } from '@/lib/orders/deliveryMethod';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_model: string;
  product_image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_type?: 'simple' | 'pack_primary' | 'pack_component';
  pack_group_id?: string | null;
  pack_id?: string | null;
  pack_parent_product_id?: string | null;
  pack_version?: number | null;
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
  delivery_method?: DeliveryMethod | null;
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
  mp_preference_id: string | null;
  mp_init_point: string | null;
  mp_sandbox_init_point: string | null;
  tracking_number?: string | null;
  items?: OrderItem[];
}

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

function getLineTypeBadge(lineType?: OrderItem['line_type']) {
  const { labels } = adminOrderMessages.items;
  if (lineType === 'pack_primary') {
    return {
      label: labels.packPrimary,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };
  }

  if (lineType === 'pack_component') {
    return {
      label: labels.packComponent,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    };
  }

  return {
    label: labels.simple,
    className: 'bg-muted text-muted-foreground border-border',
  };
}

function shortId(id?: string | null) {
  const value = String(id || '').trim();
  if (!value) return '—';
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelMPConfirm, setShowCancelMPConfirm] = useState(false);

  const { toasts, payment, fulfillment, modal, items: msgItems, cancelledState, summary, mpStatuses } = adminOrderMessages;

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    if (isOpen && orderId) fetchOrderDetails();
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { ...authHeader },
      });
      const data = await response.json();
      setOrderDetails(data);
      setTrackingInput(data.tracking_number || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    let cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
    if (!cleanNumber.startsWith('598')) cleanNumber = '598' + cleanNumber;
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleUpdatePaymentStatus = async (newPaymentStatus: string) => {
    setUpdating(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });
      if (response.ok) {
        toast.success(toasts.paymentUpdateSuccess);
        await fetchOrderDetails();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        toast.error(err.error || toasts.paymentUpdateError);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(toasts.paymentUpdateError);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setUpdating(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          status: 'cancelled',
          cancel_payment: true
        }),
      });
      
      if (response.ok) {
        toast.success(toasts.orderCancelSuccess);
        await fetchOrderDetails();
        setShowCancelConfirm(false);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        toast.error(err.error || toasts.orderCancelError);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(toasts.orderCancelError);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelMercadoPago = async () => {
    setUpdating(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          status: 'cancelled',
          cancel_mp: true
        }),
      });
      
      if (response.ok) {
        toast.success(toasts.mpCancelSuccess);
        await fetchOrderDetails();
        setShowCancelMPConfirm(false);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        toast.error(err.error || toasts.mpCancelError);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(toasts.mpCancelError);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateOrder = async (newStatus: string, newTracking?: string) => {
    setUpdating(true);
    try {
      const pickup = isPickup(orderDetails);
      const payload: any = { status: newStatus };

      if (!pickup) {
        const trackingValue = (newTracking ?? trackingInput).trim();
        if (trackingValue) {
          payload.tracking_number = trackingValue;
        }
      }

      const authHeader = await getAuthHeader();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(toasts.orderUpdateSuccess);
        await fetchOrderDetails();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('PATCH error:', err);
        toast.error(err.error || toasts.orderUpdateError);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(toasts.orderUpdateError);
    } finally {
      setUpdating(false);
    }
  };

  const getPreviousStatus = (status: string) => {
    const pickup = isPickup(orderDetails);
    if (pickup) {
      const pickupSteps: Record<string, string> = { processing: 'pending', ready: 'processing', completed: 'ready' };
      return pickupSteps[status] || null;
    } else {
      const shippingSteps: Record<string, string> = { processing: 'pending', ready: 'processing', shipped: 'ready', completed: 'shipped' };
      return shippingSteps[status] || null;
    }
  };

  const getMPStatusDisplay = (mpStatus: string | null) => {
    if (!mpStatus) return { text: mpStatuses.notAvailable, color: 'text-muted-foreground' };
    
    const statusMap: Record<string, { text: string; color: string }> = {
      approved: { text: mpStatuses.approved, color: 'text-success' },
      pending: { text: mpStatuses.pending, color: 'text-warning' },
      authorized: { text: mpStatuses.authorized, color: 'text-blue-600' },
      in_process: { text: mpStatuses.in_process, color: 'text-accent' },
      in_mediation: { text: mpStatuses.in_mediation, color: 'text-orange-600' },
      rejected: { text: mpStatuses.rejected, color: 'text-error' },
      cancelled: { text: mpStatuses.cancelled, color: 'text-error' },
      refunded: { text: mpStatuses.refunded, color: 'text-purple-600' },
      charged_back: { text: mpStatuses.charged_back, color: 'text-red-700' },
    };
    
    return statusMap[mpStatus] || { text: mpStatus, color: 'text-muted-foreground' };
  };

  if (!isOpen) return null;

  const pickup = isPickup(orderDetails);
  const isBankTransfer = orderDetails?.payment_method === 'bank_transfer';
  const isMercadoPago = orderDetails?.payment_method === 'mercadopago';
  const isCancelled = orderDetails?.order_status === 'cancelled';
  const canCancelBankTransfer = isBankTransfer && !isCancelled && orderDetails?.order_status !== 'completed';
  const canCancelMercadoPago = isMercadoPago && !isCancelled && orderDetails?.payment_status === 'pending';

  const orderItems = orderDetails?.items || [];
  const simpleItems = orderItems.filter((item) => item.line_type === 'simple' || !item.line_type);

  const packGroupsMap = new Map<string, OrderItem[]>();
  const packGroupOrder: string[] = [];

  for (const item of orderItems) {
    if (item.line_type === 'simple' || !item.pack_group_id) continue;
    const groupId = item.pack_group_id;
    if (!packGroupsMap.has(groupId)) {
      packGroupsMap.set(groupId, []);
      packGroupOrder.push(groupId);
    }
    packGroupsMap.get(groupId)?.push(item);
  }

  const orderedPackGroups = packGroupOrder.map((groupId) => {
    const items = [...(packGroupsMap.get(groupId) || [])].sort((a, b) => {
      const getRank = (lineType?: OrderItem['line_type']) => {
        if (lineType === 'pack_primary') return 0;
        if (lineType === 'pack_component') return 1;
        return 2;
      };
      return getRank(a.line_type) - getRank(b.line_type);
    });
    return { groupId, items };
  });

  const renderOrderItem = (item: OrderItem) => {
    const badge = getLineTypeBadge(item.line_type);
    const isPackLine = item.line_type && item.line_type !== 'simple';
    const isPackPrimary = item.line_type === 'pack_primary';
    const isPackComponent = item.line_type === 'pack_component';

    return (
      <div key={item.id} className="flex items-start gap-4 p-4">
        <img src={item.product_image_url} className="w-12 h-12 object-cover rounded-lg border border-border" alt="" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black truncate text-foreground">{item.product_name}</p>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {(isPackPrimary || isPackComponent) && (
            <p className="text-[9px] mt-1 font-black uppercase text-muted-foreground">
              {isPackPrimary ? msgItems.labels.commercialLine : msgItems.labels.internalLine}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground mt-1 uppercase">
            {msgItems.labels.qty}: {item.quantity} • {msgItems.labels.unit}: ${Number(item.unit_price).toLocaleString('es-UY')}
          </p>

          {isPackLine && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[9px] uppercase">
              <p className="text-muted-foreground">
                <span className="font-black">{msgItems.labels.packId}</span> <span className="font-mono">{shortId(item.pack_id)}</span>
              </p>
              <p className="text-muted-foreground">
                <span className="font-black">{msgItems.labels.packGroup}</span> <span className="font-mono">{shortId(item.pack_group_id)}</span>
              </p>
              <p className="text-muted-foreground">
                <span className="font-black">{msgItems.labels.packParent}</span> <span className="font-mono">{shortId(item.pack_parent_product_id)}</span>
              </p>
              <p className="text-muted-foreground">
                <span className="font-black">{msgItems.labels.packVersion}</span>{' '}
                <span className="font-mono">{item.pack_version != null ? item.pack_version : '—'}</span>
              </p>
            </div>
          )}
        </div>
        <p className="text-sm font-black text-primary">${Number(item.total_price).toLocaleString('es-UY')}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl flex flex-col border border-border overflow-hidden max-h-[96vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-tighter text-foreground">{modal.title}</h2>
            {orderDetails && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono">#{orderDetails.order_number}</span>
                {pickup && (
                  <span className="text-[9px] bg-purple-600/20 text-purple-600 px-2 py-0.5 rounded font-black uppercase">
                    {modal.badges.pickup}
                  </span>
                )}
                {isCancelled && (
                  <span className="text-[9px] bg-error/20 text-error px-2 py-0.5 rounded font-black uppercase">
                    {modal.badges.cancelled}
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
                
                {/* GESTIÓN DE PAGO - TRANSFERENCIAS */}
                {isBankTransfer && !isCancelled && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase flex items-center gap-2">
                        <Icon name="BanknotesIcon" size={16} /> {payment.transfer.title}
                      </h3>
                      <span className={`text-[9px] font-black px-2 py-1 rounded ${
                        orderDetails.payment_status === 'completed' 
                          ? 'bg-success/20 text-success' 
                          : orderDetails.payment_status === 'failed'
                          ? 'bg-error/20 text-error'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {orderDetails.payment_status === 'completed' ? payment.statusDisplay.paid : orderDetails.payment_status === 'failed' ? payment.statusDisplay.failed : payment.statusDisplay.pending}
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
                          {payment.transfer.markPaid}
                        </button>
                      )}
                      
                      {orderDetails.payment_status === 'completed' && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus('pending')}
                          disabled={updating}
                          className="flex-1 py-3 bg-warning text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Icon name="ClockIcon" size={16} />
                          {payment.transfer.revertPending}
                        </button>
                      )}
                    </div>

                    {orderDetails.payment_status !== 'completed' && (
                      <p className="mt-3 text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-start gap-2">
                        <Icon name="InformationCircleIcon" size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{payment.transfer.verifyWarning}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* INFORMACIÓN Y GESTIÓN DE MERCADOPAGO */}
                {isMercadoPago && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                        <Icon name="CreditCardIcon" size={16} /> {payment.mercadoPago.title}
                      </h3>
                      <span className={`text-[9px] font-black px-2 py-1 rounded ${
                        orderDetails.payment_status === 'completed' 
                          ? 'bg-success/20 text-success' 
                          : orderDetails.payment_status === 'failed'
                          ? 'bg-error/20 text-error'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {orderDetails.payment_status === 'completed' ? payment.statusDisplay.paid : orderDetails.payment_status === 'failed' ? payment.statusDisplay.failed : payment.statusDisplay.pending}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {orderDetails.payment_id && (
                        <div className="p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{payment.mercadoPago.paymentId}</p>
                          <p className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">{orderDetails.payment_id}</p>
                        </div>
                      )}

                      {orderDetails.mp_status && (
                        <div className="p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{payment.mercadoPago.mpStatus}</p>
                          <p className={`text-xs font-black ${getMPStatusDisplay(orderDetails.mp_status).color}`}>
                            {getMPStatusDisplay(orderDetails.mp_status).text}
                          </p>
                        </div>
                      )}

                      {orderDetails.mp_status_detail && (
                        <div className="p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{payment.mercadoPago.mpDetail}</p>
                          <p className="text-xs font-medium text-foreground">{orderDetails.mp_status_detail}</p>
                        </div>
                      )}

                      {orderDetails.mp_preference_id && (
                        <div className="p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{payment.mercadoPago.preferenceId}</p>
                          <p className="text-xs font-mono text-foreground break-all">{orderDetails.mp_preference_id}</p>
                        </div>
                      )}

                      {orderDetails.mp_init_point && (
                        <div className="p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">{payment.mercadoPago.paymentLink}</p>
                          <a 
                            href={orderDetails.mp_init_point} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 break-all"
                          >
                            <Icon name="ArrowTopRightOnSquareIcon" size={12} />
                            {orderDetails.mp_init_point}
                          </a>
                        </div>
                      )}
                    </div>

                    {canCancelMercadoPago && !isCancelled && (
                      <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                        {!showCancelMPConfirm ? (
                          <>
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 mb-3">
                              {payment.mercadoPago.pendingWarning}
                            </p>
                            <button 
                              onClick={() => setShowCancelMPConfirm(true)}
                              disabled={updating}
                              className="w-full py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Icon name="XCircleIcon" size={16} />
                              {payment.mercadoPago.cancelBtn}
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-error mb-3 font-bold">
                              {payment.mercadoPago.cancelConfirm}
                            </p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setShowCancelMPConfirm(false)}
                                disabled={updating}
                                className="flex-1 py-3 bg-muted text-foreground rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                              >
                                {payment.shared.noBack}
                              </button>
                              <button 
                                onClick={handleCancelMercadoPago}
                                disabled={updating}
                                className="flex-1 py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Icon name="CheckIcon" size={16} />
                                {payment.shared.yesCancel}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CANCELACIÓN DE TRANSFERENCIAS */}
                {canCancelBankTransfer && (
                  <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase flex items-center gap-2">
                        <Icon name="ExclamationTriangleIcon" size={16} /> {payment.cancelOrder.title}
                      </h3>
                    </div>

                    {!showCancelConfirm ? (
                      <>
                        <p className="text-[10px] text-red-700 dark:text-red-400 mb-3">
                          {payment.cancelOrder.warning}
                        </p>
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={updating}
                          className="w-full py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Icon name="XCircleIcon" size={16} />
                          {payment.cancelOrder.cancelBtn}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-red-700 dark:text-red-400 mb-3 font-bold">
                          {payment.cancelOrder.confirmWarning}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={updating}
                            className="flex-1 py-3 bg-muted text-foreground rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                          >
                            {payment.shared.noBack}
                          </button>
                          <button 
                            onClick={handleCancelOrder}
                            disabled={updating}
                            className="flex-1 py-3 bg-error text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Icon name="CheckIcon" size={16} />
                            {payment.shared.yesCancel}
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
                        {pickup ? fulfillment.pickupTitle : fulfillment.shippingTitle}
                      </h3>
                      {getPreviousStatus(orderDetails.order_status) && (
                        <button 
                          onClick={() => handleUpdateOrder(getPreviousStatus(orderDetails.order_status)!)} 
                          disabled={updating}
                          className="text-[9px] font-bold text-muted-foreground hover:text-error uppercase flex items-center gap-1 disabled:opacity-50"
                        >
                          <Icon name="ArrowUturnLeftIcon" size={10} /> {fulfillment.backTo} {getPreviousStatus(orderDetails.order_status)}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {orderDetails.order_status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateOrder('processing')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          {fulfillment.processOrder}
                        </button>
                      )}
                      
                      {orderDetails.order_status === 'processing' && (
                        <button 
                          onClick={() => handleUpdateOrder('ready')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          {pickup ? fulfillment.readyPickup : fulfillment.readyShipping}
                        </button>
                      )}
                      
                      {orderDetails.order_status === 'ready' && (
                        <>
                          {pickup ? (
                            <button 
                              onClick={() => handleUpdateOrder('completed')} 
                              disabled={updating}
                              className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                            >
                              {fulfillment.confirmPickup}
                            </button>
                          ) : (
                            <div className="flex flex-1 gap-2 min-w-[300px]">
                              <input 
                                type="text" 
                                className="flex-1 p-3 border-2 border-muted rounded-xl text-xs bg-background focus:border-primary outline-none text-foreground" 
                                placeholder={fulfillment.trackingPlaceholder} 
                                value={trackingInput} 
                                onChange={(e) => setTrackingInput(e.target.value)} 
                              />
                              <button 
                                onClick={() => handleUpdateOrder('shipped')} 
                                disabled={!trackingInput || updating} 
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 hover:scale-[1.02] transition-transform"
                              >
                                {fulfillment.dispatch}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {orderDetails.order_status === 'shipped' && !pickup && (
                        <button 
                          onClick={() => handleUpdateOrder('completed')} 
                          disabled={updating}
                          className="flex-1 py-3 bg-success text-white rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          {fulfillment.confirmDelivery}
                        </button>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">{fulfillment.currentFlow}</p>
                      <div className="flex items-center gap-2 text-[9px] font-mono">
                        {pickup ? (
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

                {/* Mensaje si está cancelada */}
                {isCancelled && (
                  <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-8 text-center">
                    <Icon name="XCircleIcon" size={48} className="text-error mx-auto mb-4" />
                    <h3 className="text-lg font-black text-error mb-2">{cancelledState.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cancelledState.desc}
                    </p>
                  </div>
                )}

                {/* PRODUCTOS */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/20 border-b border-border text-[10px] font-black uppercase text-foreground">{msgItems.title}</div>
                  <div className="divide-y divide-border">
                    {simpleItems.map((item) => renderOrderItem(item))}

                    {orderedPackGroups.map(({ groupId, items }) => (
                      <div key={groupId} className="border-t border-border/70">
                        <div className="px-4 py-2 bg-muted/10 text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                          {msgItems.packGroup} {shortId(groupId)}
                        </div>
                        <div className="divide-y divide-border">
                          {items.map((item) => renderOrderItem(item))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Información */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex justify-between items-baseline border-b border-border pb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{summary.total}</span>
                    <span className="text-2xl font-black text-primary">${Number(orderDetails.total).toLocaleString('es-UY')}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">{summary.paymentStatus}</p>
                    <div className={`p-2 rounded-lg border flex items-center justify-between ${
                      orderDetails.payment_status === 'completed' 
                        ? 'border-success/20 bg-success/5 text-success' 
                        : orderDetails.payment_status === 'failed'
                        ? 'border-error/20 bg-error/5 text-error'
                        : 'border-warning/20 bg-warning/5 text-warning'
                    }`}>
                      <span className="text-[10px] font-black uppercase">
                        {orderDetails.payment_status === 'completed' ? payment.statusDisplay.capitalized.paid : orderDetails.payment_status === 'failed' ? payment.statusDisplay.capitalized.failed : payment.statusDisplay.capitalized.pending}
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
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">{summary.buyer}</h4>
                    <p className="text-xs font-black leading-tight">{orderDetails.customer_name}</p>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted/30 rounded-lg border border-border">
                      <Icon name="PhoneIcon" size={14} className="text-primary" />
                      <span className="text-xs font-mono font-bold">{orderDetails.customer_phone}</span>
                    </div>
                  </section>
                  <section className="pt-4 border-t border-border">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2">
                      {pickup ? summary.pickupLabel : summary.shippingLabel}
                    </h4>
                    {pickup ? (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase flex items-center gap-2">
                          <Icon name="BuildingStorefrontIcon" size={14} />
                          {summary.pickupDesc}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold leading-relaxed">{orderDetails.shipping_address}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">{orderDetails.shipping_city}, {orderDetails.shipping_department}</p>
                        {orderDetails.tracking_number && (
                          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{summary.tracking}</p>
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
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase border border-border rounded-xl hover:bg-muted transition-colors text-foreground">{modal.close}</button>
          {orderDetails && (
            <button 
              onClick={() => openWhatsApp(orderDetails.customer_phone)}
              className="px-6 py-2 bg-[#25D366] text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={16} /> {modal.whatsapp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OrderSummary from './OrderSummary';
import PaymentMethodSelector from './PaymentMethodSelector';
import MercadoPagoForm from './MercadoPagoForm';
import BankTransferForm from './BankTransferForm';
import CustomerInfoForm from './CustomerInfoForm';
import { readCart, clearCart, type CartItem as CartItemType } from '@/lib/cart';

// ... (Interfaces OrderItem, PaymentMethod, CustomerInfo se mantienen igual)
// ... (PICKUP_ADDRESS y isCustomerInfoValid se mantienen igual)
// Copia las interfaces del archivo original para no ocupar espacio, aquí pongo el componente:

interface OrderItem {
  id: string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
}


interface CheckoutPayloadItemProduct {
  type: 'product';
  product_id: string;
  quantity: number;
}

interface CheckoutPayloadItemPack {
  type: 'pack';
  parent_product_id: string;
  pack_id: string;
  quantity: number;
}

type CheckoutPayloadItem = CheckoutPayloadItemProduct | CheckoutPayloadItemPack;


function mapCartItemsToCheckoutPayload(items: CartItemType[]): CheckoutPayloadItem[] {
  const mapped: CheckoutPayloadItem[] = [];

  for (const i of (items || [])) {
    const quantity = Number(i?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const rawId = String(i?.id || '');

    if (rawId.startsWith('pack::')) {
      const [, parentProductId, packId] = rawId.split('::');
      if (!parentProductId || !packId) continue;
      mapped.push({ type: 'pack', parent_product_id: parentProductId, pack_id: packId, quantity });
      continue;
    }

    const legacyPack = rawId.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-(.+)$/i);
    if (legacyPack) {
      mapped.push({ type: 'pack', parent_product_id: legacyPack[1], pack_id: legacyPack[2], quantity });
      continue;
    }

    mapped.push({ type: 'product', product_id: rawId, quantity });
  }

  return mapped;
}

interface CustomerInfo {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
}

type DeliveryMethod = 'delivery' | 'pickup';

const PICKUP_ADDRESS =
  'José Enrique Rodó 2219, 11200 Montevideo, Departamento de Montevideo';

function isCustomerInfoValid(ci: CustomerInfo, method: DeliveryMethod) {
  const baseOk = Boolean(ci.email && ci.fullName && ci.phone);
  if (!baseOk) return false;
  if (method === 'pickup') return true;
  return Boolean(ci.address && ci.city && ci.department);
}


function normalizeCustomerInfoForIdempotency(ci: CustomerInfo, deliveryMethod: DeliveryMethod) {
  return {
    email: String(ci?.email || '').trim().toLowerCase(),
    fullName: String(ci?.fullName || '').trim(),
    phone: String(ci?.phone || '').trim(),
    address: deliveryMethod === 'pickup' ? '' : String(ci?.address || '').trim(),
    city: deliveryMethod === 'pickup' ? '' : String(ci?.city || '').trim(),
    department: deliveryMethod === 'pickup' ? '' : String(ci?.department || '').trim(),
    postalCode: deliveryMethod === 'pickup' ? '' : String(ci?.postalCode || '').trim(),
  };
}

function computeAttemptHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function generateAttemptSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

export default function CheckoutPaymentInteractive() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mercadopago' | 'bank_transfer'>('mercadopago');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [isProcessing, setIsProcessing] = useState(false);

  const [cart, setCart] = useState<CartItemType[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    department: 'Montevideo',
    postalCode: '',
  });

  useEffect(() => {
    setIsHydrated(true);
    setCart(readCart());
  }, []);

  const orderItems: OrderItem[] = useMemo(() => {
    return (cart || []).map((it) => ({
      id: it.id,
      name: it.name,
      model: it.model || '',
      price: it.price,
      quantity: it.quantity,
      image: it.image,
      alt: it.alt,
    }));
  }, [cart]);

  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems]
  );

  const shipping = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    return subtotal >= 2000 ? 0 : 300;
  }, [deliveryMethod, subtotal]);

  const total = subtotal + shipping;

  const checkoutPayloadItems = useMemo(() => mapCartItemsToCheckoutPayload(cart), [cart]);

  const attemptFingerprint = useMemo(() => {
    const normalizedItems = [...checkoutPayloadItems]
      .map((it) =>
        it.type === 'product'
          ? `product:${it.product_id}:${Number(it.quantity || 0)}`
          : `pack:${it.parent_product_id}:${it.pack_id}:${Number(it.quantity || 0)}`,
      )
      .sort();

    const payload = {
      items: normalizedItems,
      paymentMethod: selectedPaymentMethod,
      deliveryMethod,
      customerInfo: normalizeCustomerInfoForIdempotency(customerInfo, deliveryMethod),
    };

    return JSON.stringify(payload);
  }, [checkoutPayloadItems, selectedPaymentMethod, deliveryMethod, customerInfo]);

  const attemptRef = useRef<{ fingerprint: string; seed: string } | null>(null);
  if (!attemptRef.current || attemptRef.current.fingerprint !== attemptFingerprint) {
    attemptRef.current = {
      fingerprint: attemptFingerprint,
      seed: generateAttemptSeed(),
    };
  }

  const createOrderIdempotencyKey = useMemo(() => {
    return `co-${computeAttemptHash(`${attemptRef.current?.seed || ''}::${attemptFingerprint}`)}`;
  }, [attemptFingerprint]);

  const referenceNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `POV${year}${rand}`;
  }, []);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'mercadopago',
      name: 'MercadoPago',
      description: 'Pago seguro con checkout de MercadoPago',
      icon: 'CreditCardIcon',
      badge: 'Recomendado',
    },
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      description: 'Pago directo desde tu banco - Procesamiento en 24-48hs',
      icon: 'BuildingLibraryIcon',
    },
  ];

  const handleCustomerInfoUpdate = (data: CustomerInfo) => setCustomerInfo(data);

  async function createOrder() {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo,
        items: checkoutPayloadItems,
        paymentMethod: selectedPaymentMethod,
        deliveryMethod,
        idempotency_key: createOrderIdempotencyKey,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'create-order failed');

    return data as { ok: true; orderId: string; orderNumber: string; total: number };
  }

  async function createMpPreference(orderId: string) {
    const res = await fetch('/api/mp-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'mp-preference failed');

    return data as { ok: true; initPoint?: string; sandboxInitPoint?: string };
  }

  const handlePayMercadoPago = async () => {
    try {
      if (!cart.length) {
        router.push('/shopping-cart');
        return;
      }
      if (!isCustomerInfoValid(customerInfo, deliveryMethod)) {
        alert('Completá tus datos de contacto antes de pagar.');
        return;
      }
      setIsProcessing(true);
      const created = await createOrder();
      const pref = await createMpPreference(created.orderId);
      const url = pref.initPoint || pref.sandboxInitPoint;
      if (!url) throw new Error('No initPoint returned by MercadoPago');
      window.location.href = url;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Error al iniciar pago con MercadoPago');
      setIsProcessing(false);
    }
  };

  // --- LÓGICA CORREGIDA PARA TRANSFERENCIA ---
  const handleBankTransferSubmit = async () => {
    try {
      if (!cart.length) {
        router.push('/shopping-cart');
        return;
      }

      if (!isCustomerInfoValid(customerInfo, deliveryMethod)) {
        alert('Completá tus datos de contacto antes de confirmar.');
        // Hacemos scroll arriba para que vean el error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setIsProcessing(true);

      // 1. Guardamos la orden en BD (estado pending)
      const created = await createOrder();

      // 2. Limpiamos carrito
      clearCart();

      // 3. Generamos Link de WhatsApp
      const whatsappNumber = '59897801202';
      const message = `¡Hola POV Store! Quiero finalizar mi compra #${created.orderNumber} por Transferencia Bancaria para acceder al descuento del 5%.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      // 4. Redirigimos a WhatsApp
      window.location.href = whatsappUrl;

    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Error al crear pedido por transferencia');
      setIsProcessing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <p className="text-lg font-medium text-foreground mb-2">Tu carrito está vacío</p>
          <p className="text-sm text-muted-foreground mb-6">Agregá productos antes de finalizar la compra.</p>
          <button onClick={() => router.push('/homepage')} className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg">Volver a la tienda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">Finalizar Compra</h1>
          <p className="text-muted-foreground mt-2">Completa tu información y elige tu método de pago preferido</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-card rounded-lg border border-border p-6">
              <CustomerInfoForm
                onUpdate={handleCustomerInfoUpdate}
                initialData={customerInfo}
                deliveryMethod={deliveryMethod}
                pickupAddress={PICKUP_ADDRESS}
                onDeliveryChange={setDeliveryMethod} 
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <PaymentMethodSelector
                methods={paymentMethods}
                selectedMethod={selectedPaymentMethod}
                onSelect={(id) => setSelectedPaymentMethod(id as any)}
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              {selectedPaymentMethod === 'mercadopago' ? (
                <MercadoPagoForm onPay={handlePayMercadoPago} isProcessing={isProcessing} />
              ) : (
                <BankTransferForm 
                  onSubmit={handleBankTransferSubmit} 
                  referenceNumber={referenceNumber}
                  isProcessing={isProcessing} // Pasamos el estado de carga
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <OrderSummary
                items={orderItems}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                isExpanded={isSummaryExpanded}
                onToggle={() => setIsSummaryExpanded(!isSummaryExpanded)}
                deliveryMethod={deliveryMethod}
                pickupAddress={PICKUP_ADDRESS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

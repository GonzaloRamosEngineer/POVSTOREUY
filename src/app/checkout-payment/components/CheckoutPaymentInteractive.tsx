'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import OrderSummary from './OrderSummary';
import PaymentMethodSelector from './PaymentMethodSelector';
import MercadoPagoForm from './MercadoPagoForm';
import BankTransferForm from './BankTransferForm';
import CustomerInfoForm from './CustomerInfoForm';
import { readCart, clearCart, type CartItem as CartItemType } from '@/lib/cart';

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

interface CustomerInfo {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
}

function isCustomerInfoValid(ci: CustomerInfo) {
  // mínimo viable (podés endurecerlo después)
  return Boolean(ci.email && ci.fullName && ci.phone && ci.address && ci.city && ci.department);
}

export default function CheckoutPaymentInteractive() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mercadopago' | 'bank_transfer'>('mercadopago');
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

  const shipping = subtotal >= 2000 ? 0 : 250;
  const total = subtotal + shipping;

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
        items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
        paymentMethod: selectedPaymentMethod,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'create-order failed');
    return data as { ok: true; orderId: string; referenceNumber: string; total: number };
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

      if (!isCustomerInfoValid(customerInfo)) {
        alert('Completá tus datos de contacto y envío antes de pagar.');
        return;
      }

      setIsProcessing(true);

      // 1) crear orden (Supabase)
      const created = await createOrder();

      // 2) crear preferencia MP y redirigir
      const pref = await createMpPreference(created.orderId);

      const url = pref.initPoint || pref.sandboxInitPoint;
      if (!url) throw new Error('No initPoint returned by MercadoPago');

      // ⚠️ No limpiamos el carrito acá (más seguro limpiarlo al confirmar pago)
      window.location.href = url;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Error al iniciar pago con MercadoPago');
      setIsProcessing(false);
    }
  };

  const handleBankTransferSubmit = async () => {
    try {
      if (!cart.length) {
        router.push('/shopping-cart');
        return;
      }

      if (!isCustomerInfoValid(customerInfo)) {
        alert('Completá tus datos de contacto y envío antes de confirmar.');
        return;
      }

      setIsProcessing(true);

      const created = await createOrder();

      // para transferencia: dejamos pedido pending y vaciamos carrito
      clearCart();

      router.push(`/order-confirmation?orderId=${created.orderId}&status=pending`);
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
          <p className="text-sm text-muted-foreground mb-6">
            Agregá productos antes de finalizar la compra.
          </p>
          <button
            onClick={() => router.push('/homepage')}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
            Finalizar Compra
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa tu información y elige tu método de pago preferido
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <CustomerInfoForm onUpdate={handleCustomerInfoUpdate} initialData={customerInfo} />
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
                <BankTransferForm onSubmit={handleBankTransferSubmit} referenceNumber={referenceNumber} />
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

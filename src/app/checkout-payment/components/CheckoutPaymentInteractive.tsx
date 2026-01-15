'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrderSummary from './OrderSummary';
import PaymentMethodSelector from './PaymentMethodSelector';
import MercadoPagoForm from './MercadoPagoForm';
import BankTransferForm from './BankTransferForm';
import CustomerInfoForm from './CustomerInfoForm';

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

export default function CheckoutPaymentInteractive() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    department: 'Montevideo',
    postalCode: ''
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockOrderItems: OrderItem[] = [
  {
    id: '1',
    name: 'Cámara POV 4K Pro',
    model: 'Modelo Pro',
    price: 8990.00,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1686245189976-cb9f1cc79891",
    alt: 'Black POV 4K Pro camera with sleek modern design and metallic finish on white background'
  },
  {
    id: '2',
    name: 'Cámara POV 4K Básico',
    model: 'Modelo Básico',
    price: 5990.00,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1727005356049-d215642301d7",
    alt: 'Compact POV 4K Basic camera in matte black with minimalist design on neutral surface'
  }];


  const paymentMethods: PaymentMethod[] = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Tarjeta de crédito o débito - Hasta 6 cuotas sin interés',
    icon: 'CreditCardIcon',
    badge: 'Recomendado'
  },
  {
    id: 'bank_transfer',
    name: 'Transferencia Bancaria',
    description: 'Pago directo desde tu banco - Procesamiento en 24-48hs',
    icon: 'BuildingLibraryIcon'
  }];


  const subtotal = mockOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const referenceNumber = `POV${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

  const handleMercadoPagoSubmit = (paymentData: any) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      router.push('/order-confirmation');
    }, 2000);
  };

  const handleBankTransferSubmit = () => {
    router.push('/order-confirmation');
  };

  const handleCustomerInfoUpdate = (data: CustomerInfo) => {
    setCustomerInfo(data);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
            Finalizar Compra
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa tu información y elige tu método de pago preferido
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-lg border border-border p-6">
              <CustomerInfoForm
                onUpdate={handleCustomerInfoUpdate}
                initialData={customerInfo} />

            </div>

            {/* Payment Method Selection */}
            <div className="bg-card rounded-lg border border-border p-6">
              <PaymentMethodSelector
                methods={paymentMethods}
                selectedMethod={selectedPaymentMethod}
                onSelect={setSelectedPaymentMethod} />

            </div>

            {/* Payment Forms */}
            <div className="bg-card rounded-lg border border-border p-6">
              {selectedPaymentMethod === 'mercadopago' ?
              <MercadoPagoForm
                onSubmit={handleMercadoPagoSubmit}
                isProcessing={isProcessing} /> :


              <BankTransferForm
                onSubmit={handleBankTransferSubmit}
                referenceNumber={referenceNumber} />

              }
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <OrderSummary
                items={mockOrderItems}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                isExpanded={isSummaryExpanded}
                onToggle={() => setIsSummaryExpanded(!isSummaryExpanded)} />

            </div>
          </div>
        </div>
      </div>
    </div>);

}
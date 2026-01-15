'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import OrderSummaryCard from './OrderSummaryCard';
import CustomerInfoCard from './CustomerInfoCard';
import PaymentStatusCard from './PaymentStatusCard';
import DeliveryInfoCard from './DeliveryInfoCard';
import NextStepsCard from './NextStepsCard';
import EmailConfirmationCard from './EmailConfirmationCard';
import SocialShareCard from './SocialShareCard';

interface OrderItem {
  id: string;
  name: string;
  model: string;
  quantity: number;
  price: number;
  image: string;
  alt: string;
}

interface OrderData {
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  transactionId: string;
  referenceNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDepartment: string;
  shippingPostalCode: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  shippingMethod: string;
}

const OrderConfirmationInteractive: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockOrderData: OrderData = {
    orderNumber: 'POV-2026-001234',
    orderDate: '13/01/2026',
    items: [
    {
      id: '1',
      name: 'Cámara POV 4K Pro',
      model: 'Modelo Pro',
      quantity: 1,
      price: 8990,
      image: "https://images.unsplash.com/photo-1701120285912-889e5e4210ba",
      alt: 'Cámara POV 4K Pro compacta negra con lente gran angular sobre fondo blanco'
    }],

    subtotal: 8990,
    shipping: 350,
    total: 9340,
    paymentMethod: 'MercadoPago',
    paymentStatus: 'completed',
    transactionId: 'MP-2026-789456123',
    referenceNumber: 'REF-UY-456789',
    customerName: 'Martín Rodríguez',
    customerEmail: 'martin.rodriguez@email.com',
    customerPhone: '+598 99 123 456',
    shippingAddress: 'Av. 18 de Julio 1234, Apto 501',
    shippingCity: 'Montevideo',
    shippingDepartment: 'Montevideo',
    shippingPostalCode: '11200',
    estimatedDelivery: '17/01/2026 - 19/01/2026',
    trackingNumber: 'UY-TRACK-2026-456789',
    shippingMethod: 'Envío Estándar Uruguay'
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-6">
          <div className="h-96 bg-card animate-pulse rounded-lg" />
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-6 lg:py-12">
        {/* Success Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
            <Icon name="CheckCircleIcon" size={40} className="text-success" variant="solid" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Gracias por tu compra. Tu cámara POV 4K está siendo preparada para el envío.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <OrderSummaryCard
              orderNumber={mockOrderData.orderNumber}
              orderDate={mockOrderData.orderDate}
              items={mockOrderData.items}
              subtotal={mockOrderData.subtotal}
              shipping={mockOrderData.shipping}
              total={mockOrderData.total}
              paymentMethod={mockOrderData.paymentMethod} />


            <NextStepsCard />

            <SocialShareCard orderNumber={mockOrderData.orderNumber} />
          </div>

          {/* Right Column - Customer & Delivery Info */}
          <div className="space-y-6">
            <PaymentStatusCard
              status={mockOrderData.paymentStatus}
              transactionId={mockOrderData.transactionId}
              paymentMethod={mockOrderData.paymentMethod}
              referenceNumber={mockOrderData.referenceNumber} />


            <CustomerInfoCard
              name={mockOrderData.customerName}
              email={mockOrderData.customerEmail}
              phone={mockOrderData.customerPhone}
              address={mockOrderData.shippingAddress}
              city={mockOrderData.shippingCity}
              department={mockOrderData.shippingDepartment}
              postalCode={mockOrderData.shippingPostalCode} />


            <DeliveryInfoCard
              estimatedDelivery={mockOrderData.estimatedDelivery}
              trackingNumber={mockOrderData.trackingNumber}
              shippingMethod={mockOrderData.shippingMethod} />


            <EmailConfirmationCard
              email={mockOrderData.customerEmail}
              supportEmail="soporte@povstoreuruguay.com"
              supportPhone="+598 2 123 4567" />

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/homepage"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-smooth focus-ring">

            <Icon name="HomeIcon" size={20} className="text-primary-foreground" />
            Volver al Inicio
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-md transition-smooth focus-ring">

            <Icon name="PrinterIcon" size={20} className="text-foreground" />
            Imprimir Confirmación
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Tienes alguna pregunta sobre tu pedido?
          </p>
          <Link
            href="/homepage"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-smooth">

            Contactar Soporte
            <Icon name="ArrowRightIcon" size={16} className="text-primary" />
          </Link>
        </div>
      </div>
    </div>);

};

export default OrderConfirmationInteractive;
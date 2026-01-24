import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import OrderConfirmationInteractive from './components/OrderConfirmationInteractive';

export const metadata: Metadata = {
  title: 'Confirmación de Pedido - POV Store Uruguay',
  description: 'Confirmación de tu compra de cámara POV 4K. Revisa los detalles de tu pedido, información de envío y estado del pago en POV Store Uruguay.',
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-[1400px] mx-auto px-4 py-8 lg:px-6">
            <div className="h-96 bg-card animate-pulse rounded-lg" />
          </div>
        </div>
      }
    >
      <OrderConfirmationInteractive />
    </Suspense>
  );
}
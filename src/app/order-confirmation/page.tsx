import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import OrderConfirmationInteractive from './components/OrderConfirmationInteractive';

export const metadata: Metadata = {
  title: 'Confirmación de Pedido - POV Store Uruguay',
  description: 'Confirmación de tu compra de cámara POV 4K. Revisa los detalles de tu pedido, información de envío y estado del pago en POV Store Uruguay.',
};

export default function OrderConfirmationPage() {
  return (
    <>
      <Header />
      <OrderConfirmationInteractive />
    </>
  );
}
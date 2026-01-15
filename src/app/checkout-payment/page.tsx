import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import CheckoutPaymentInteractive from './components/CheckoutPaymentInteractive';

export const metadata: Metadata = {
  title: 'Finalizar Compra - POV Store Uruguay',
  description: 'Completa tu compra de forma segura con MercadoPago o transferencia bancaria. Envío gratis a todo Uruguay en cámaras POV 4K.',
};

export default function CheckoutPaymentPage() {
  return (
    <>
      <Header />
      <CheckoutPaymentInteractive />
    </>
  );
}
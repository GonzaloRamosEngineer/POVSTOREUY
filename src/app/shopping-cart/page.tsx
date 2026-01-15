import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ShoppingCartInteractive from './components/ShoppingCartInteractive';

export const metadata: Metadata = {
  title: 'Carrito de Compras - POV Store Uruguay',
  description: 'Revisa y gestiona tus cámaras POV 4K antes de proceder al pago. Envío gratis a todo Uruguay en compras superiores a $2.000.',
};

export default function ShoppingCartPage() {
  return (
    <>
      <Header />
      <ShoppingCartInteractive />
    </>
  );
}
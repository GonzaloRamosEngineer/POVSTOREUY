import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from './components/ProductDetailsInteractive';

export const metadata: Metadata = {
  title: 'Cámara POV 4K Mini - Detalles del Producto - POV Store Uruguay',
  description: 'Descubre la Cámara POV 4K Mini con grabación profesional, WiFi integrado y diseño ultra compacto. Especificaciones técnicas completas, reseñas de clientes y compra con envío gratis en Uruguay.',
};

export default function ProductDetailsPage() {
  return (
    <>
      <Header />
      <ProductDetailsInteractive />
    </>
  );
}
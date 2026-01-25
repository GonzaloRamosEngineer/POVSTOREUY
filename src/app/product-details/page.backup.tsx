import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from './components/ProductDetailsInteractive';

export const metadata: Metadata = {
  title: 'Cámara POV 4K Mini - Detalles del Producto - POV Store Uruguay',
  description:
    'Descubre la Cámara POV 4K Mini con grabación profesional, WiFi integrado y diseño ultra compacto. Especificaciones técnicas completas, reseñas de clientes y compra con envío gratis en Uruguay.',
};

function ProductDetailsFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<ProductDetailsFallback />}>
      <div className="min-h-screen bg-background">
        <Header />
        <ProductDetailsInteractive />
      </div>
    </Suspense>
  );
}

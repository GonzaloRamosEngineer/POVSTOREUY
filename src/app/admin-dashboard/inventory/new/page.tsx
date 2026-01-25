import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ProductForm from '../components/ProductForm';

export const metadata: Metadata = {
  title: 'Nuevo producto - Admin | POV Store Uruguay',
  description: 'Crear un nuevo producto.',
};

export default function NewProductPage() {
  return (
    <>
      <Header isAdminMode={true} />
      <main className="min-h-screen bg-background">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Nuevo producto</h1>
            <p className="text-base text-muted-foreground">Completá los datos para crear un producto.</p>
          </div>

          <ProductForm mode="create" />
        </div>
      </main>
    </>
  );
}

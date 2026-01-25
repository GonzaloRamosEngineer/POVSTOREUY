import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ProductForm from '../components/ProductForm';

export const metadata: Metadata = {
  title: 'Editar producto - Admin | POV Store Uruguay',
  description: 'Editar un producto.',
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Header isAdminMode={true} />
      <main className="min-h-screen bg-background">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Editar producto</h1>
            <p className="text-base text-muted-foreground">Actualizá propiedades, stock y publicación.</p>
          </div>

          <ProductForm mode="edit" productId={id} />
        </div>
      </main>
    </>
  );
}

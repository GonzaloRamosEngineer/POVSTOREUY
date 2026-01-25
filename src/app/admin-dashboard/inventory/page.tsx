import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import InventoryPageInteractive from './components/InventoryPageInteractive';

export const metadata: Metadata = {
  title: 'Inventario - Admin | POV Store Uruguay',
  description: 'Gestiona productos, stock y estado de publicación.',
};

export default function AdminInventoryPage() {
  return (
    <>
      <Header isAdminMode={true} />
      <main className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Inventario
            </h1>
            <p className="text-base text-muted-foreground">
              Gestioná tus productos, stock, precios y estado de publicación.
            </p>
          </div>

          <InventoryPageInteractive />
        </div>
      </main>
    </>
  );
}

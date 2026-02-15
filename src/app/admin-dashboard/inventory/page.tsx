import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
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
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-10">
          
          {/* BOTÓN VOLVER - DISEÑO CON PRESENCIA */}
          <div className="flex items-center mb-8">
            <Link 
              href="/admin-dashboard" 
              className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border rounded-xl transition-all duration-200 group shadow-sm"
            >
              <Icon 
                name="ArrowLeftIcon" 
                size={18} 
                className="transform group-hover:-translate-x-1 transition-transform text-red-500" 
              />
              <span className="font-bold tracking-tight">Volver al Dashboard</span>
            </Link>
          </div>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-1.5 h-8 bg-red-600 rounded-full" /> {/* Acento visual */}
               <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">
                Inventario
              </h1>
            </div>
            <p className="text-lg text-muted-foreground ml-4">
              Gestioná tus productos, stock, precios y estado de publicación.
            </p>
          </div>

          <InventoryPageInteractive />
        </div>
      </main>
    </>
  );
}
import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import AdminDashboardInteractive from './components/AdminDashboardInteractive';

export const metadata: Metadata = {
  title: 'Panel de Administración - POV Store Uruguay',
  description: 'Gestiona pedidos, inventario, pagos y analíticas de POV Store Uruguay. Monitorea el rendimiento del negocio y administra operaciones de cámaras POV 4K.',
};

export default function AdminDashboardPage() {
  return (
    <>
      <Header isAdminMode={true} />
      <main className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Panel de Administración
            </h1>
            <p className="text-base text-muted-foreground">
              Gestiona tu tienda POV Store Uruguay desde un solo lugar
            </p>
          </div>

          {/* Interactive Dashboard Content */}
          <AdminDashboardInteractive />
        </div>
      </main>
    </>
  );
}
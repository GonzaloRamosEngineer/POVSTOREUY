import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  status: 'critical' | 'low' | 'normal';
}

interface InventoryAlertsProps {
  items: InventoryItem[];
}

export default function InventoryAlerts({ items }: InventoryAlertsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-error/10 text-error border-error/20';
      case 'low':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-success/10 text-success border-success/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return 'ExclamationTriangleIcon';
      case 'low':
        return 'ExclamationCircleIcon';
      default:
        return 'CheckCircleIcon';
    }
  };

  const alertItems = items.filter((item) => item.status !== 'normal');

  if (alertItems.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 card-elevation">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="CheckCircleIcon" size={24} className="text-success" variant="solid" />
          <h3 className="text-lg font-heading font-semibold text-foreground">Inventario Saludable</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Todos los productos tienen stock suficiente. No hay alertas en este momento.
        </p>

        <Link
          href="/admin-dashboard/inventory"
          className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-smooth focus-ring"
        >
          <Icon name="CubeIcon" size={18} />
          <span className="text-sm font-medium">Ver inventario</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 card-elevation">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="ExclamationTriangleIcon" size={24} className="text-warning" variant="solid" />
          <h3 className="text-lg font-heading font-semibold text-foreground">Alertas de Inventario</h3>
        </div>
        <span className="inline-flex items-center justify-center w-8 h-8 bg-error text-error-foreground rounded-full text-sm font-bold">
          {alertItems.length}
        </span>
      </div>

      <div className="space-y-3">
        {alertItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(item.status)}`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Icon name={getStatusIcon(item.status) as any} size={20} variant="solid" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock actual: <span className="font-mono font-medium">{item.stock}</span> unidades
                </p>
              </div>
            </div>

            {/* ✅ ahora sí: ir a editar el producto */}
            <Link
              href={`/admin-dashboard/inventory/${item.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted rounded-md transition-smooth focus-ring ml-3"
            >
              <Icon name="PencilIcon" size={16} className="text-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">Gestionar</span>
            </Link>
          </div>
        ))}
      </div>

      {/* ✅ ahora sí: inventario completo real */}
      <Link
        href="/admin-dashboard/inventory"
        className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-smooth focus-ring"
      >
        <Icon name="CubeIcon" size={18} />
        <span className="text-sm font-medium">Ver inventario completo</span>
      </Link>
    </div>
  );
}

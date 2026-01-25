'use client';

import Icon from '@/components/ui/AppIcon';

export type ProductRow = {
  id: string;
  name: string;
  model: string;
  price: number;
  original_price: number | null;
  stock_count: number;
  stock_status: string;
  is_active: boolean;
  updated_at: string;
};

export default function ProductTable({
  products,
  onEdit,
  onDeactivate,
}: {
  products: ProductRow[];
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  if (!products.length) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No hay productos para mostrar con los filtros actuales.
      </div>
    );
  }

  const money = (n: number) => {
    const rounded = Math.round(n);
    return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  const badge = (p: ProductRow) => {
    if (!p.is_active) return 'Inactivo';
    if (p.stock_count === 0) return 'Sin stock';
    if (p.stock_count <= 5) return 'Bajo stock';
    return 'Activo';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-3 px-3">Producto</th>
            <th className="py-3 px-3">Precio</th>
            <th className="py-3 px-3">Stock</th>
            <th className="py-3 px-3">Estado</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border/50">
              <td className="py-3 px-3">
                <div className="font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.model}</div>
              </td>

              <td className="py-3 px-3">
                <div className="text-foreground">{money(Number(p.price || 0))}</div>
                {p.original_price ? (
                  <div className="text-xs text-muted-foreground line-through">
                    {money(Number(p.original_price || 0))}
                  </div>
                ) : null}
              </td>

              <td className="py-3 px-3">
                <span className="font-mono text-foreground">{p.stock_count}</span>
              </td>

              <td className="py-3 px-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-foreground text-xs">
                  {badge(p)}
                </span>
              </td>

              <td className="py-3 px-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(p.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-background hover:bg-muted rounded-md transition-smooth focus-ring"
                  >
                    <Icon name="PencilIcon" size={16} />
                    <span className="hidden sm:inline">Editar</span>
                  </button>

                  <button
                    onClick={() => onDeactivate(p.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/70 rounded-md transition-smooth focus-ring"
                    title="Desactivar (is_active = false)"
                  >
                    <Icon name="ArchiveBoxIcon" size={16} />
                    <span className="hidden sm:inline">Desactivar</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

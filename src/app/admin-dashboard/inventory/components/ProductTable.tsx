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
  image_url: string; 
  colors?: { name: string; hex: string; stock?: number }[]; 
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
      <div className="p-12 text-center text-sm text-gray-500 border-2 border-dashed rounded-xl bg-gray-50">
        <Icon name="ArchiveBoxIcon" size={32} className="mx-auto mb-3 text-gray-300" />
        No hay productos para mostrar.
      </div>
    );
  }

  const money = (n: number) => {
    const rounded = Math.round(n);
    return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  const badge = (p: ProductRow) => {
    if (!p.is_active) return <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">Inactivo</span>;
    if (p.stock_count === 0) return <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-100">Sin Stock</span>;
    if (p.stock_count <= 5) return <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-50 text-yellow-800 text-xs font-medium border border-yellow-100">Bajo Stock</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">Activo</span>;
  };

  return (
    <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600 w-16">Img</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Producto</th>
              <th className="py-3 px-4 font-semibold text-gray-600 w-64">Stock por Variante</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Precio</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-center">Total</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Estado</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                
                {/* 1. IMAGEN */}
                <td className="py-3 px-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white p-0.5">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full h-full object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Icon name="PhotoIcon" size={16} />
                      </div>
                    )}
                  </div>
                </td>

                {/* 2. PRODUCTO */}
                <td className="py-3 px-4 align-top">
                  <div className="font-semibold text-gray-900 mt-1">{p.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.model}</div>
                </td>

                {/* 3. VARIANTES (VISUALIZACIÓN MEJORADA) */}
                <td className="py-3 px-4 align-middle">
                  {p.colors && p.colors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.colors.map((c, i) => {
                        const stock = c.stock || 0;
                        return (
                          <div 
                            key={i} 
                            className={`
                              flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border text-xs font-mono
                              ${stock === 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-gray-200 text-gray-600'}
                            `}
                            title={c.name}
                          >
                            <div 
                              className="w-3 h-3 rounded-full border border-black/10 shadow-sm" 
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="font-bold">{stock}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sin variantes</span>
                  )}
                </td>

                {/* 4. PRECIO */}
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{money(Number(p.price || 0))}</div>
                </td>

                {/* 5. STOCK TOTAL */}
                <td className="py-3 px-4 text-center">
                  <span className={`text-sm font-bold ${p.stock_count === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                    {p.stock_count}
                  </span>
                </td>

                {/* 6. ESTADO */}
                <td className="py-3 px-4">
                  {badge(p)}
                </td>

                {/* 7. ACCIONES */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(p.id)}
                      className="p-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all"
                      title="Editar"
                    >
                      <Icon name="PencilIcon" size={16} />
                    </button>

                    <button
                      onClick={() => onDeactivate(p.id)}
                      className={`p-2 bg-white border border-gray-200 rounded-md shadow-sm transition-all ${p.is_active ? 'text-gray-600 hover:text-red-600 hover:border-red-300' : 'text-green-600 hover:text-green-700 hover:border-green-300'}`}
                      title={p.is_active ? "Ocultar producto" : "Publicar producto"}
                    >
                      {p.is_active ? <Icon name="ArchiveBoxIcon" size={16} /> : <Icon name="CheckIcon" size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
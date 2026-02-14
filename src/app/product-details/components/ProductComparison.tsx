'use client';

import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface SimpleProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  show_on_home?: boolean;
  tech_specs: Record<string, string>;
}

export default function ProductComparison({ 
  currentProduct, 
  otherProducts 
}: { 
  currentProduct: SimpleProduct; 
  otherProducts: SimpleProduct[] 
}) {
  
  const comparisonList = [currentProduct, ...otherProducts]
    .filter((p) => p.show_on_home === true || p.id === currentProduct.id)
    .filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i)
    .sort((a, b) => a.price - b.price); 

  const displayProducts = comparisonList.slice(0, 3);

  // Ajustamos las 'keys' para que coincidan EXACTAMENTE con tus STANDARD_SPECS del administrador
  const rows = [
    { label: 'Resolución Máxima', key: 'Resolución Máxima', icon: 'VideoCameraIcon' },
    { label: 'Estabilización', key: 'Estabilización', icon: 'BoltIcon' },
    { label: 'Resistencia al Agua', key: 'Resistencia al Agua', icon: 'DropIcon' },
    { label: 'Duración Batería', key: 'Duración Batería', icon: 'Battery50Icon' },
    { label: 'Ángulo de Visión', key: 'Ángulo de Visión', icon: 'EyeIcon' },
    { label: 'Sensor', key: 'Sensor', icon: 'CpuChipIcon' },
    { label: 'Conectividad', key: 'Conectividad', icon: 'WifiIcon' },
    { label: 'Peso', key: 'Peso', icon: 'ScaleIcon' },
  ];

  return (
    <div className="overflow-x-auto pb-4 pt-8">
      <div className="min-w-[700px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 w-1/4"></th>
              {displayProducts.map((p) => {
                const isCurrent = p.id === currentProduct.id;
                return (
                  <th key={p.id} className={`p-4 w-1/4 align-bottom pb-10 relative rounded-t-3xl transition-colors group ${isCurrent ? 'bg-red-50/80' : 'hover:bg-gray-50'}`}>
                    {isCurrent && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md z-10 whitespace-nowrap">
                        Viendo ahora
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div className="relative h-44 w-full flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-105">
                        <div className={`absolute inset-4 rounded-full blur-2xl -z-10 transition-opacity duration-500
                           ${isCurrent 
                             ? 'bg-gradient-to-tr from-red-200/40 to-red-100/40 opacity-100' 
                             : 'bg-gradient-to-tr from-gray-200/50 to-gray-100/50 opacity-0 group-hover:opacity-100'
                           }`} 
                        />
                        <div className="relative h-36 w-36 drop-shadow-[0_8px_12px_rgba(0,0,0,0.08)]">
                          <AppImage src={p.image_url} alt={p.name} className="object-contain w-full h-full" />
                        </div>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 transition-colors ${isCurrent ? 'text-red-700' : 'text-gray-900 group-hover:text-gray-700'}`}>
                        {p.name}
                      </h3>
                      <p className="text-sm font-mono font-bold text-gray-900 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        ${p.price.toLocaleString('es-UY')}
                      </p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={row.key} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="p-4 py-5">
                  <div className="flex items-center gap-3 pl-2">
                    <Icon name={row.icon as any} size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-sm font-bold text-gray-700">{row.label}</span>
                  </div>
                </td>

                {displayProducts.map((p) => {
                  const isCurrent = p.id === currentProduct.id;
                  // Buscamos el valor en tech_specs usando la key exacta
                  const value = p.tech_specs?.[row.key] || '-';
                  
                  return (
                    <td 
                      key={p.id} 
                      className={`p-4 py-5 text-center text-sm font-medium leading-relaxed transition-colors
                        ${isCurrent 
                          ? 'bg-red-50/80 text-gray-900 border-x border-red-100/50' 
                          : 'text-gray-600 group-hover:bg-gray-100/50'}
                        ${row.key === 'Resolución Máxima' ? 'font-bold text-base' : ''} 
                      `}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
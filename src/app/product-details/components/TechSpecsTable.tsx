import React from 'react';
import { TechSpecs } from '@/types/product';
import Icon from '@/components/ui/AppIcon';

interface Props {
  specs: TechSpecs | null;
}

// Mapeo de iconos para mantener consistencia con el Comparador y el Admin
const SPEC_ICONS: Record<string, any> = {
  'Resolución Máxima': 'VideoCameraIcon',
  'Estabilización': 'BoltIcon',
  'Resistencia al Agua': 'DropIcon',
  'Duración Batería': 'Battery50Icon',
  'Ángulo de Visión': 'EyeIcon',
  'Sensor': 'CpuChipIcon',
  'Conectividad': 'WifiIcon',
  'Peso': 'ScaleIcon',
  'Dimensiones': 'ArrowsPointingOutIcon',
  'Micrófono': 'MicrophoneIcon',
};

export default function TechSpecsTable({ specs }: Props) {
  if (!specs || Object.keys(specs).length === 0) return null;

  return (
    <section className="w-full bg-white py-24 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Especificaciones Técnicas
          </h2>
          <div className="w-20 h-1 bg-red-600 mx-auto rounded-full" />
        </header>
        
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
          <table className="w-full text-left border-collapse">
            <tbody>
              {Object.entries(specs).map(([key, value], index) => {
                const iconName = SPEC_ICONS[key] || 'InformationCircleIcon';
                
                return (
                  <tr 
                    key={key} 
                    className={`
                      group transition-all duration-300
                      border-b border-gray-50 last:border-0 
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} 
                      hover:bg-red-50/40
                    `}
                  >
                    <th className="py-6 px-6 md:px-10 w-1/3 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 group-hover:text-red-600 group-hover:border-red-100 transition-colors shadow-sm">
                          <Icon name={iconName} size={20} />
                        </div>
                        <span className="text-sm md:text-base font-bold text-gray-800 tracking-tight">
                          {key}
                        </span>
                      </div>
                    </th>
                    <td className="py-6 px-6 md:px-10 text-gray-600 text-sm md:text-base leading-relaxed align-middle">
                      {value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 font-medium uppercase tracking-widest">
          POV Store Uruguay • Specs Oficiales 2026
        </p>
      </div>
    </section>
  );
}
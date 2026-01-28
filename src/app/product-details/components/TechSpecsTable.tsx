import React from 'react';
import { TechSpecs } from '@/types/product';

interface Props {
  specs: TechSpecs | null;
}

export default function TechSpecsTable({ specs }: Props) {
  if (!specs || Object.keys(specs).length === 0) return null;

  return (
    <section className="w-full bg-gray-50 py-20 border-t border-gray-200">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          Especificaciones Técnicas
        </h2>
        
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <tbody>
              {Object.entries(specs).map(([key, value], index) => (
                <tr 
                  key={key} 
                  className={`
                    border-b border-gray-100 last:border-0 
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                    hover:bg-blue-50/50 transition-colors
                  `}
                >
                  <th className="py-5 px-6 md:px-8 font-semibold text-gray-800 w-1/3 text-sm md:text-base align-middle">
                    {key}
                  </th>
                  <td className="py-5 px-6 md:px-8 text-gray-600 text-sm md:text-base align-middle">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
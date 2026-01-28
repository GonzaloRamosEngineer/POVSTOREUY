import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import Icon from '@/components/ui/AppIcon';

interface Props {
  currentProduct: Product;
  allProducts: Product[]; // Recibimos todos para filtrar y comparar
}

export default function ProductComparison({ currentProduct, allProducts }: Props) {
  // 1. Filtramos para comparar solo CÁMARAS (evitamos memorias SD, etc)
  // Asumimos que las cámaras tienen "tech_specs" cargadas.
  const cameras = allProducts.filter(p => p.tech_specs && Object.keys(p.tech_specs).length > 0);

  // Si no hay con qué comparar (solo hay 1 cámara), no mostramos la tabla
  if (cameras.length < 2) return null;

  // 2. Definimos qué características queremos comparar (El orden importa)
  // Estas claves deben coincidir con las que pusimos en el SQL (tech_specs)
  const featuresToCompare = [
    "Resolución Video",
    "Estabilización",
    "Batería",
    "Resistencia Agua",
    "Ángulo",
    "Peso"
  ];

  return (
    <section className="w-full bg-white py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-gray-900">
          Compara los Modelos
        </h2>

        {/* CONTENEDOR DE LA TABLA CON SCROLL HORIZONTAL (Para móviles) */}
        <div className="overflow-x-auto pb-6">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr>
                {/* Columna vacía (Esquina superior izquierda) */}
                <th className="p-4 w-1/4 bg-white sticky left-0 z-10 border-b border-gray-100"></th>
                
                {/* Cabeceras de Productos */}
                {cameras.map((camera) => (
                  <th key={camera.id} className="p-4 w-1/4 text-center align-bottom border-b border-gray-100 min-w-[200px]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-32 h-32 md:w-40 md:h-40 mb-2">
                        <Image 
                          src={camera.image_url} 
                          alt={camera.name} 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">{camera.name}</h3>
                      <p className="text-lg font-bold text-blue-600">${camera.price}</p>
                      
                      {/* Botón de acción */}
                      {camera.id === currentProduct.id ? (
                        <span className="px-4 py-1 bg-gray-100 text-gray-500 text-sm rounded-full font-medium">
                          Viendo ahora
                        </span>
                      ) : (
                        <Link 
                          href={`/products/${camera.id}`}
                          className="px-6 py-2 bg-black text-white text-sm rounded-full font-bold hover:bg-gray-800 transition-colors"
                        >
                          Ver Detalles
                        </Link>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* Filas de características */}
              {featuresToCompare.map((feature, index) => (
                <tr key={feature} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  
                  {/* Etiqueta de la característica (Sticky a la izquierda) */}
                  <th className={`
                    p-6 text-sm md:text-base font-bold text-gray-900 sticky left-0 z-10
                    ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] md:shadow-none
                  `}>
                    {feature}
                  </th>

                  {/* Valor de cada cámara */}
                  {cameras.map((camera) => (
                    <td key={camera.id} className="p-6 text-center text-sm md:text-base text-gray-600 border-l border-transparent">
                      {/* Accedemos al tech_specs dinámicamente. Si no tiene el dato, ponemos un guión */}
                      {camera.tech_specs ? camera.tech_specs[feature] || '-' : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
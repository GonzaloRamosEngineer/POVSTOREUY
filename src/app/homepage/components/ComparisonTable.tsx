'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const ComparisonTable = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // DATOS REALES DE TUS PRODUCTOS
  const products = [
    {
      id: 'c100-plus',
      name: 'SJCAM C100+',
      price: '$5.990',
      badge: 'Bestseller',
      badgeColor: 'bg-blue-900/30 text-blue-400 border border-blue-500/30',
      link: '/products/1aabfacb-5f35-4bcf-9e6d-0316483d8362'
    },
    {
      id: 'c200-pro',
      name: 'SJCAM C200',
      price: '$8.490',
      badge: 'Pro',
      badgeColor: 'bg-red-900/30 text-red-400 border border-red-500/30',
      link: '/products/c98290bd-884f-49ce-9554-71a0210638f8'
    }
  ];

  const features = [
    { label: 'Resolución Máxima', c100: '4K @ 30fps', c200: '4K Ultra / 2K Clear', icon: 'VideoCameraIcon' },
    { label: 'Estabilización', c100: 'EIS (Giroscopio)', c200: 'SuperSmooth (6 Ejes)', icon: 'BoltIcon' },
    { label: 'Resistencia al Agua', c100: '30m con carcasa', c200: 'IPX4 (Cuerpo) / 40m (Carcasa)', icon: 'ShieldCheckIcon' },
    { label: 'Duración Batería', c100: '~2 horas', c200: '~3 horas', icon: 'BoltIcon' },
    { label: 'Peso', c100: '42g (Pluma)', c200: '78g (Metálica)', icon: 'ScaleIcon' },
    { label: 'Pantalla', c100: 'No (Control por App)', c200: 'Sí (1.28" LCD)', icon: 'DeviceTabletIcon' },
    { label: 'Visión Nocturna', c100: 'Básica', c200: 'Super Night Vision', icon: 'MoonIcon' },
    { label: 'Ideal para...', c100: 'Vlogs, Mascotas, Casco', c200: 'Cine, Deportes Extremos', icon: 'StarIcon' },
  ];

  if (!isHydrated) return null;

  return (
    <section className="py-20 px-4 bg-neutral-950 relative overflow-hidden border-t border-neutral-900">
      
      {/* Elementos decorativos de fondo (Tech Noir) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-red-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-900/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            Encuentra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-600">Compañera Ideal</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Ambas son increíbles, pero una está hecha para tu estilo de aventura.
          </p>
        </div>

        {/* --- CONTENEDOR DE LA TABLA --- */}
        <div className="bg-neutral-900/30 backdrop-blur-sm rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden">
          
          {/* HEADER DE PRODUCTOS (SIN IMAGEN - Solo Tipografía) */}
          <div className="grid grid-cols-3 divide-x divide-neutral-800 border-b border-neutral-800 bg-neutral-900/20">
            {/* Columna 1: Label */}
            <div className="p-6 flex items-center justify-center text-neutral-400 font-medium italic text-sm md:text-base">
              Selecciona tu modelo
            </div>
            
            {/* Columnas Productos */}
            {products.map((p) => (
              <div key={p.id} className="p-8 flex flex-col items-center text-center group cursor-pointer transition-colors hover:bg-neutral-800/30">
                
                {/* Badge Marketinero */}
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                  {p.badge}
                </span>

                {/* Título Grande */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{p.name}</h3>
                
                {/* Precio */}
                <p className="text-red-500 font-mono font-bold text-lg md:text-xl mb-6">{p.price}</p>
                
                {/* Botón */}
                <Link 
                  href={p.link}
                  className="hidden md:inline-flex px-6 py-2 rounded-full border border-neutral-700 text-white text-sm font-bold hover:bg-white hover:text-black transition-all"
                >
                  Ver Detalles
                </Link>
              </div>
            ))}
          </div>

          {/* CUERPO DE LA TABLA */}
          <div className="divide-y divide-neutral-800">
            {features.map((feature, idx) => (
              <div key={idx} className="grid grid-cols-3 divide-x divide-neutral-800 hover:bg-neutral-800/20 transition-colors">
                
                {/* Etiqueta (Columna 1) */}
                <div className="p-4 md:p-6 flex items-center gap-3 text-sm md:text-base font-medium text-neutral-400">
                  <div className="p-2 bg-neutral-800/50 rounded-lg hidden md:block">
                    <Icon name={feature.icon as any} size={20} className="text-neutral-400" />
                  </div>
                  {feature.label}
                </div>

                {/* Valor C100+ (Columna 2) */}
                <div className="p-4 md:p-6 flex items-center justify-center text-center text-sm md:text-base font-semibold text-white">
                  {feature.c100}
                </div>

                {/* Valor C200 (Columna 3) - Destacado */}
                <div className="p-4 md:p-6 flex items-center justify-center text-center text-sm md:text-base font-bold text-white bg-red-900/10">
                  {feature.c200}
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER MOBILE (Botones de acción para móvil) */}
          <div className="md:hidden grid grid-cols-2 gap-4 p-4 border-t border-neutral-800 bg-neutral-950">
            {products.map((p) => (
              <Link 
                key={p.id}
                href={p.link}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-bold text-center transition-all ${
                  p.id === 'c200-pro' 
                    ? 'bg-red-600 text-white hover:bg-red-500' 
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                Ver {p.name.replace('SJCAM ', '')}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
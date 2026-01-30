'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const TestimonialsSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const tribes = [
    { id: 'Moto', icon: 'FireIcon', label: 'Motorvlog' },
    { id: 'Water', icon: 'SparklesIcon', label: 'Acuático' },
    { id: 'Trek', icon: 'MapIcon', label: 'Aventura' },
    { id: 'Fitness', icon: 'BoltIcon', label: 'Deportes' },
  ];

  if (!isHydrated) return null;

  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden border-t border-neutral-900">
      
      {/* Fondo Decorativo - Luces sutiles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-16"> {/* gap-16 para evitar que se apriete */}
        
        {/* HEADER */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-900/30 text-red-500 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
            Próximamente
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
            La Comunidad <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-600">POV Uruguay.</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Estamos construyendo el espacio definitivo para creadores. <br/>
            Muy pronto podrás compartir tus aventuras y aparecer aquí.
          </p>
        </div>

        {/* --- AREA "LOCKED" (EL HYPE) --- */}
        {/* Usamos un contenedor relativo con altura mínima para dar aire */}
        <div className="relative w-full min-h-[400px] rounded-3xl border border-neutral-800 bg-neutral-900/30 overflow-hidden flex items-center justify-center p-8 text-center">
          
          {/* Fondo abstracto (Patrón de ruido o gradiente oscuro) */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Círculo central con Candado */}
          <div className="relative z-10 max-w-lg">
             <div className="w-20 h-20 mx-auto bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-red-900/20 border border-neutral-700">
                <Icon name="LockClosedIcon" size={32} className="text-neutral-400" />
             </div>
             <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
               El Hall de la Fama se está cargando...
             </h3>
             <p className="text-neutral-400 mb-8 leading-relaxed">
               ¿Sos biker, viajero o deportista? Preparate para mostrarle a Uruguay 
               lo que podés hacer con una POV Camera.
             </p>

             {/* Botón de Acción (Notificarme) */}
             <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 mx-auto">
                <Icon name="BellIcon" size={18} />
                Avisame cuando lance
             </button>
          </div>
        </div>

        {/* --- BARRA DE TRIBUS (Categorías) --- */}
        <div className="w-full">
          <p className="text-center text-neutral-500 text-sm uppercase tracking-widest mb-8">
            Preparando espacio para:
          </p>
          
          {/* Grid Responsivo que no se rompe */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {tribes.map((tribe) => (
              <div 
                key={tribe.id}
                className="group h-24 md:h-32 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-col items-center justify-center transition-all cursor-default"
              >
                {/* Icono con efecto glow al hover */}
                <div className="mb-3 p-2 rounded-full bg-neutral-800/50 text-neutral-400 group-hover:text-white group-hover:bg-red-600 transition-all duration-300">
                   <Icon name={tribe.icon as any} size={24} />
                </div>
                <span className="text-sm font-bold text-neutral-500 group-hover:text-white transition-colors">
                  {tribe.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
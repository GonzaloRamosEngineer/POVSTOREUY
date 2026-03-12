'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  onCtaClick: () => void;
  // Mantenemos estas props para compatibilidad
  basicStock: number; 
  proStock: number;
}

const HeroSection = ({ onCtaClick }: HeroSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className="relative w-full min-h-[80vh] bg-neutral-900 flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse w-3/4 h-32 bg-neutral-800 rounded-2xl"></div>
        </div>
      </section>
    );
  }

  return (
    // CORRECCIÓN: Se eliminó "mt-16 md:mt-0" para que no haya huecos blancos en mobile
    <section className="relative w-full min-h-[75vh] md:min-h-[85vh] flex flex-col justify-between bg-black overflow-hidden">
      
      {/* 1. VIDEO DE FONDO A PANTALLA COMPLETA (Escala de grises) */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover grayscale-[40%] brightness-[0.35]"
        >
          <source src="https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/BannerVideo.mp4" type="video/mp4" />
        </video>
        {/* Overlay oscuro extra para asegurar lectura perfecta */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* 2. CONTENIDO CENTRAL (Textos y Botón) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-6xl mx-auto text-center pt-10 pb-20">
        
        {/* Título Principal (FORZADO A 2 RENGLONES PERFECTOS) */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic text-white uppercase tracking-tighter mb-6 drop-shadow-2xl leading-[1.1] w-full">
          <span className="block">GRABÁ TU VIDA EN POV</span>
          
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-medium drop-shadow-md">
          Cámaras y kits para capturar cada momento
        </p>

        {/* Botón de Acción Rojo */}
        <button
          onClick={onCtaClick}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-sm md:text-base px-10 py-4 md:py-5 rounded-full uppercase tracking-widest transition-all transform hover:scale-105 hover:-translate-y-1 shadow-[0_10px_30px_rgba(220,38,38,0.5)] flex items-center gap-3"
        >
          VER KITS
        </button>
      </div>

      {/* 3. BARRA DE CONFIANZA INFERIOR (Renovada y Minimalista) */}
      <div className="relative z-20 bg-white border-b border-gray-200 w-full py-4 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 md:gap-8 text-[11px] sm:text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest">
          
          <div className="flex items-center gap-3 group">
            <Icon name="TruckIcon" className="text-red-600 group-hover:scale-110 transition-transform" size={20} /> 
            <span>ENVÍOS NACIONALES</span>
          </div>
          
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300"></div>

          <div className="flex items-center gap-3 group">
            <Icon name="ShieldCheckIcon" className="text-red-600 group-hover:scale-110 transition-transform" size={20} /> 
            <span>GARANTÍA OFICIAL</span>
          </div>
          
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300"></div>

          <div className="flex items-center gap-3 group">
            <Icon name="CreditCardIcon" className="text-red-600 group-hover:scale-110 transition-transform" size={20} /> 
            <span>PAGOS SEGUROS</span>
          </div>

        </div>
      </div>
      
    </section>
  );
};

export default HeroSection;
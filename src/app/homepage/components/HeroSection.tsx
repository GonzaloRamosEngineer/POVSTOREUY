'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import StockWidget from './StockWidget';

interface HeroSectionProps {
  onCtaClick: () => void;
  basicStock: number;
  proStock: number;
}

const HeroSection = ({ onCtaClick, basicStock, proStock }: HeroSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className="relative min-h-screen w-full bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neutral-900 via-black to-black" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-tight">
                Filma en 4K lo que ven tus ojos
              </h1>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen w-full bg-black overflow-hidden flex items-center">
      {/* 1. EFECTOS DE FONDO (ATMÓSFERA ROJA) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradiente radial base */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/50 via-black to-black" />
        
        {/* Mancha de luz roja gigante arriba a la izquierda */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] opacity-60 animate-pulse-subtle" />
        
        {/* Mancha de luz roja abajo a la derecha */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-900/30 rounded-full blur-[120px] opacity-60" />
        
        {/* Textura de ruido para darle realismo */}
        <div className="absolute inset-0 bg-noise opacity-[0.05]" />
      </div>

      {/* 2. VIDEO DE FONDO (SUTIL) */}
      <div className="absolute inset-0 overflow-hidden opacity-30 mix-blend-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover grayscale brightness-50"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-person-recording-a-video-with-a-camera-4054-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 3. CONTENIDO PRINCIPAL */}
      <div className="relative z-10 w-full px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* COLUMNA IZQUIERDA: TEXTO Y BOTONES */}
          <div className="space-y-8 text-center lg:text-left animate-fade-in">
            
            {/* Badge de Stock */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-950/40 border border-red-500/30 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.15)] backdrop-blur-md">
              <Icon name="SparklesIcon" size={16} className="text-red-500" variant="solid" />
              <span className="text-xs font-bold text-red-100 uppercase tracking-wider">Stock Limitado en Uruguay</span>
            </div>

            {/* Título Principal con GLOW ROJO (Efecto Neón) */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold text-white leading-[0.9] tracking-tight drop-shadow-[0_0_35px_rgba(220,38,38,0.7)]">
              Filma en 4K lo <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-red-200">
                que ven tus ojos
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-neutral-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Cámaras POV mini 4K para creadores de contenido. <br className="hidden md:block" />
              <span className="text-white font-medium">Calidad profesional, precio accesible.</span>
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center pt-4">
              <button
                onClick={onCtaClick}
                className="group relative w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Comprar Ahora
                  <Icon name="ArrowRightIcon" size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <Link
                href="#productos"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-lg font-semibold rounded-xl transition-all border border-white/10 hover:border-red-500/30 backdrop-blur-sm"
              >
                Ver Modelos
              </Link>
            </div>

            {/* Iconos de Confianza (Rojos) */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3 pt-6 text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-2">
                <Icon name="TruckIcon" size={18} className="text-red-500" />
                <span>Envío gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={18} className="text-red-500" />
                <span>Garantía 12 meses</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CreditCardIcon" size={18} className="text-red-500" />
                <span>MercadoPago</span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TARJETA DE VIDEO Y WIDGET */}
          <div className="relative space-y-8 animate-fade-in lg:pl-10" style={{ animationDelay: '0.2s' }}>
            
            {/* TARJETA DE VIDEO con el GLOW TRASERO QUE PEDISTE */}
            <div className="relative group perspective-1000">
              
              {/* --- AQUÍ ESTÁ EL FONDO DETRÁS DEL VIDEO (El Glow Rojo Intenso) --- */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-red-600 via-red-800 to-red-900 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 group-hover:blur-2xl transition-all duration-500" />
              
              {/* Contenedor del Video */}
              <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.01]">
                <div className="aspect-video relative overflow-hidden">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  >
                    <source src="https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/BannerVideo.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Overlay oscuro para que resalte el botón de play */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                  {/* Botón Play Central (Rojo)
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-red-600 hover:bg-red-500 text-white rounded-full p-5 shadow-[0_0_30px_rgba(220,38,38,0.5)] transform hover:scale-110 transition-all duration-300">
                      <Icon name="PlayIcon" size={36} variant="solid" />
                    </button>
                  </div> */}
                  
                  {/* Etiqueta flotante interior */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/70 backdrop-blur-md rounded-lg p-3 border border-white/10 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                      <div>
                        <p className="text-white font-bold text-sm leading-none">Ver POV 4K en acción</p>
                        <p className="text-neutral-400 text-xs mt-1">Calidad profesional hands-free</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget de Stock (Contenedor externo ajustado) */}
            <div className="relative z-10">
              <StockWidget basicStock={basicStock} proStock={proStock} />
            </div>
          </div>
        </div>
      </div>

      {/* Flecha de Scroll */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50">
        <Icon name="ChevronDownIcon" size={32} className="text-white" />
      </div>
    </section>
  );
};

export default HeroSection;
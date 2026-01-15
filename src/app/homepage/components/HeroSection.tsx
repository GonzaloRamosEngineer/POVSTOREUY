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
      <section className="relative min-h-screen w-full bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-gray-900 via-gray-950 to-black" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-tight">
                Filma en 4K lo que ven tus ojos
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
                Cámaras POV mini 4K para creadores de contenido. Calidad profesional, precio accesible.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen w-full bg-gray-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-gray-900 via-gray-950 to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-noise opacity-5" />
      </div>

      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-person-recording-a-video-with-a-camera-4054-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-orange/20 border border-neon-orange rounded-full mb-4">
              <Icon name="SparklesIcon" size={20} className="text-neon-orange" variant="solid" />
              <span className="text-sm font-bold text-neon-orange">Stock Limitado en Uruguay</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-tight drop-shadow-glow">
              Filma en 4K lo que ven tus ojos
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
              Cámaras POV mini 4K para creadores de contenido. Calidad profesional, precio accesible.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
              <button
                onClick={onCtaClick}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-neon-cyan to-primary hover:from-primary hover:to-neon-cyan text-white text-lg font-bold rounded-lg transition-all shadow-neon-glow hover:shadow-neon-glow-strong transform hover:scale-105 focus-ring"
              >
                Comprar Ahora
              </button>
              <Link
                href="#productos"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white text-lg font-semibold rounded-lg transition-all border border-gray-700 hover:border-neon-cyan focus-ring"
              >
                Ver Modelos
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Icon name="TruckIcon" size={20} className="text-neon-cyan" />
                <span>Envío gratis en Uruguay</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={20} className="text-success" />
                <span>Garantía 12 meses</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CreditCardIcon" size={20} className="text-neon-orange" />
                <span>MercadoPago seguro</span>
              </div>
            </div>
          </div>

          {/* Right Column - Demo Card & Stock Widget */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Demo Video Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-primary rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                <div className="aspect-video relative">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-person-recording-a-video-with-a-camera-4054-large.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-neon-cyan/90 hover:bg-neon-cyan text-white rounded-full p-6 shadow-neon-glow transform hover:scale-110 transition-all">
                      <Icon name="PlayIcon" size={32} variant="solid" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-neon-cyan/30">
                      <p className="text-white font-bold text-sm">▶ Ver POV 4K en acción</p>
                      <p className="text-gray-400 text-xs">Calidad profesional hands-free</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Widget */}
            <StockWidget basicStock={basicStock} proStock={proStock} />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <Icon name="ChevronDownIcon" size={32} className="text-gray-500" />
      </div>
    </section>
  );
};

export default HeroSection;
'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface MobileStickyCTAProps {
  onCtaClick: () => void;
  totalStock: number;
}

const MobileStickyCTA = ({ onCtaClick, totalStock }: MobileStickyCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setIsVisible(window.scrollY > heroHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden transform transition-transform duration-300">
      {/* TECH NOIR: Fondo casi negro con borde superior rojo intenso */}
      <div className="bg-neutral-950/95 backdrop-blur-lg border-t-2 border-red-600 shadow-[0_-5px_20px_rgba(220,38,38,0.25)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-neutral-400 font-medium">Quedan solo</p>
            {/* RED ALERT: Texto rojo para urgencia */}
            <p className="text-lg font-bold text-red-500 animate-pulse">{totalStock} unidades</p>
          </div>
          <button
            onClick={onCtaClick}
            // RED ALERT: Botón Rojo Solido + Sombra Roja
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2 active:scale-95"
          >
            <Icon name="ShoppingCartIcon" size={20} variant="solid" />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileStickyCTA;
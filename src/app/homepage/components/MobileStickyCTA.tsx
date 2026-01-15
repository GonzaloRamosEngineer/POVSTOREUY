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
      <div className="bg-gray-900/95 backdrop-blur-lg border-t-2 border-neon-cyan shadow-neon-glow-strong p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400">Quedan solo</p>
            <p className="text-lg font-bold text-neon-orange">{totalStock} unidades</p>
          </div>
          <button
            onClick={onCtaClick}
            className="flex-1 bg-gradient-to-r from-neon-cyan to-primary hover:from-primary hover:to-neon-cyan text-white font-bold py-3 px-6 rounded-lg shadow-neon-glow transition-all transform hover:scale-105 flex items-center justify-center gap-2"
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
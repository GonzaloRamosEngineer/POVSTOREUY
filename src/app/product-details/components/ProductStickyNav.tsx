'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProductStickyNavProps {
  productName: string;
  productPrice: number;
  productImage: string;
  averageRating: number;
  totalReviews: number;
}

// Reordenado para coincidir con la página: Comparar -> Reseñas -> FAQ
const SECTIONS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'specs', label: 'Especificaciones' },
  { id: 'compare', label: 'Comparar' },
  { id: 'reviews', label: 'Opiniones' }, // Subió de posición
  { id: 'faq', label: 'Preguntas' },     // Bajó de posición
];

export default function ProductStickyNav({ 
  productName, 
  productPrice, 
  productImage,
  averageRating,
  totalReviews 
}: ProductStickyNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar barra al bajar un poco la pantalla
      setIsVisible(window.scrollY > 600);
      setIsMobileMenuOpen(false);

      // Detectar sección activa para iluminar el botón correspondiente
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Ajustamos el umbral para que cambie la pestaña activa un poco antes de llegar
          if (rect.top >= 0 && rect.top < 400) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Espacio para no tapar el título con el header + nav
      const y = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label || 'Menú';

  return (
    <>
      <div className="fixed top-[64px] left-0 right-0 w-full bg-white/95 backdrop-blur-md shadow-sm z-40 border-b border-gray-200 animate-in slide-in-from-top-2 duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 relative">
            
            {/* 1. IZQUIERDA: Miniatura y Precio */}
            <div className="flex items-center gap-3 w-auto md:w-1/3">
               <div className="relative w-8 h-8 rounded border border-gray-100 overflow-hidden bg-white hidden sm:block">
                 <img src={productImage} alt={productName} className="w-full h-full object-contain" />
               </div>
               <div className="flex flex-col leading-tight">
                  <span className="font-bold text-gray-900 text-[11px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{productName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-red-600 font-bold">${productPrice.toLocaleString('es-UY')}</span>
                    <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2">
                      <Icon name="StarIcon" size={10} variant="solid" className="text-yellow-400" />
                      <span className="text-[10px] text-gray-400 font-bold">{averageRating}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* 2. CENTRO (DESKTOP): Pestañas Reordenadas */}
            <div className="hidden md:flex flex-1 justify-center space-x-6 h-full items-center">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    text-[11px] font-black uppercase tracking-widest px-1 py-4 border-b-2 transition-all duration-200
                    ${activeSection === item.id 
                      ? 'border-red-600 text-red-600' 
                      : 'border-transparent text-gray-400 hover:text-gray-900'}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 2. CENTRO (MOBILE): Dropdown */}
            <div className="md:hidden flex-1 flex justify-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-800 active:scale-95 transition-transform"
              >
                <span className="text-red-600">•</span>
                {activeLabel}
                <Icon name="ChevronDownIcon" size={10} className={`transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}/>
              </button>
            </div>
            
            {/* 3. DERECHA: Acción de subida */}
            <div className="w-auto md:w-1/3 flex justify-end">
              <button 
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md group"
                onClick={scrollToTop}
              >
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest mr-2">Comprar</span>
                <Icon name="ArrowUpIcon" size={12} className="text-white group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-[120px] left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-white rounded-xl shadow-xl z-50 border border-gray-100 p-2 md:hidden animate-in zoom-in-95 duration-200">
            <div className="flex flex-col">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    px-4 py-3 text-xs font-black uppercase tracking-wider text-left rounded-lg transition-colors flex justify-between items-center
                    ${activeSection === item.id 
                      ? 'bg-red-50 text-red-600' 
                      : 'text-gray-500 hover:bg-gray-50'}
                  `}
                >
                  {item.label}
                  {activeSection === item.id && <Icon name="CheckIcon" size={14} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
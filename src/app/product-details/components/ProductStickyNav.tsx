'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProductStickyNavProps {
  productName: string;
  productPrice: number;
  productImage: string;
}

const SECTIONS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'specs', label: 'Especificaciones' },
  { id: 'compare', label: 'Comparar' },
  { id: 'faq', label: 'Preguntas' },
  { id: 'reviews', label: 'Reseñas' },
];

export default function ProductStickyNav({ productName, productPrice, productImage }: ProductStickyNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar barra al bajar 600px
      setIsVisible(window.scrollY > 600);
      setIsMobileMenuOpen(false); // Cerrar menú si scrollea rápido

      // Detectar sección activa
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
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
      const offset = 140; // Ajuste para header
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
            
            {/* 1. IZQUIERDA: Miniatura del Producto */}
            <div className="flex items-center gap-3 w-auto md:w-1/4">
               <div className="relative w-8 h-8 rounded border border-gray-100 overflow-hidden bg-white">
                 <img src={productImage} alt={productName} className="w-full h-full object-contain" />
               </div>
               <div className="flex flex-col leading-none">
                  <span className="font-bold text-gray-900 text-xs truncate max-w-[120px] md:max-w-[200px]">{productName}</span>
                  <span className="font-mono text-xs text-gray-500 font-medium">${productPrice.toLocaleString('es-UY')}</span>
               </div>
            </div>

            {/* 2. CENTRO (DESKTOP): Pestañas normales */}
            <div className="hidden md:flex flex-1 justify-center space-x-6 h-full items-center">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    text-sm font-bold uppercase tracking-wide px-1 py-4 border-b-2 transition-colors
                    ${activeSection === item.id 
                      ? 'border-red-600 text-red-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 2. CENTRO (MOBILE): Dropdown Inteligente */}
            <div className="md:hidden flex-1 flex justify-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-800 active:scale-95 transition-transform"
              >
                <span className="text-red-600">•</span>
                {activeLabel}
                <Icon name="ChevronDownIcon" size={12} className={`transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}/>
              </button>
            </div>
            
            {/* 3. DERECHA: Botón Comprar */}
            <div className="w-auto md:w-1/4 flex justify-end">
              <button 
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-5 md:py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                onClick={scrollToTop}
                aria-label="Comprar"
              >
                <span className="hidden md:inline text-sm font-bold mr-2">Comprar</span>
                <Icon name="ArrowUpIcon" size={14} className="text-white" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL (Overlay) */}
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
                    px-4 py-3 text-sm font-bold text-left rounded-lg transition-colors flex justify-between items-center
                    ${activeSection === item.id 
                      ? 'bg-red-50 text-red-600' 
                      : 'text-gray-600 hover:bg-gray-50'}
                  `}
                >
                  {item.label}
                  {activeSection === item.id && <Icon name="CheckIcon" size={16} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
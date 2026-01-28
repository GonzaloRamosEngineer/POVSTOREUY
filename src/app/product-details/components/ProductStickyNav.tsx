'use client';

import React, { useState, useEffect } from 'react';

export default function ProductStickyNav() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar la barra solo después de bajar 600px
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Ajuste de offset (-80px) para que la barra no tape el título de la sección
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-md z-50 border-b border-gray-200 transition-all duration-300 transform translate-y-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center space-x-4 md:space-x-10 h-14 items-center overflow-x-auto no-scrollbar">
          {/* Agregamos 'compare' y 'faq' al array de secciones */}
          {['overview', 'specs', 'compare', 'faq', 'reviews'].map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className={`
                text-xs md:text-sm font-medium uppercase tracking-wide px-2 py-4 border-b-2 transition-colors whitespace-nowrap
                ${activeSection === item 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'}
              `}
            >
              {item === 'overview' && 'Resumen'}
              {item === 'specs' && 'Especificaciones'}
              {item === 'compare' && 'Comparar'}
              {item === 'faq' && 'Preguntas'} {/* <--- NUEVO */}
              {item === 'reviews' && 'Reseñas'}
            </button>
          ))}
          
          {/* Botón de compra rápido */}
          <button 
            className="hidden lg:block ml-8 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
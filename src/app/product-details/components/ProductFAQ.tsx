'use client';

import React, { useState } from 'react';
import { FAQItem } from '@/types/product';
import Icon from '@/components/ui/AppIcon'; // Asumiendo que tienes un icono de flecha o más/menos

interface Props {
  faqs: FAQItem[] | null;
}

export default function ProductFAQ({ faqs }: Props) {
  // Si no hay preguntas, no mostramos nada
  if (!faqs || faqs.length === 0) return null;

  // Estado para saber cuál pregunta está abierta (null = ninguna)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white py-16 md:py-24 border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          Preguntas Frecuentes
        </h2>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div 
              key={index} 
              className={`border rounded-xl transition-all duration-300 ${openIndex === index ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-bold text-gray-900 text-lg pr-8">
                  {item.question}
                </span>
                <span className={`transform transition-transform duration-300 text-gray-400 ${openIndex === index ? 'rotate-180' : ''}`}>
                  {/* Si no tienes ChevronDownIcon, usa PlusIcon o similar */}
                  <Icon name="ChevronDownIcon" size={24} /> 
                </span>
              </button>
              
              <div 
                className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0 pb-0'}`}
              >
                <div className="overflow-hidden px-6 text-gray-600 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
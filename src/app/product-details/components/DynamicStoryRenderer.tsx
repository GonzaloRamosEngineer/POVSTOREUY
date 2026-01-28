import React from 'react';
import Image from 'next/image';
import { StorySection } from '@/types/product';

interface Props {
  content: StorySection[] | null;
}

export default function DynamicStoryRenderer({ content }: Props) {
  if (!content || !Array.isArray(content) || content.length === 0) return null;

  return (
    <section className="w-full bg-white pb-16">
      <div className="flex flex-col gap-20 md:gap-32">
        {content.map((section, index) => (
          <div key={index} className="w-full">
            
            {/* --- VIDEO CORREGIDO (Error 1 y 2) --- */}
            {section.type === 'full_video' && (
              <div className="relative w-full h-[60vh] min-h-[500px] md:h-[800px] overflow-hidden group bg-black">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={section.image_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  // Eliminamos el poster que daba 404, o pon una URL real si la tienes
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
                  <h2 className="text-5xl md:text-8xl font-extrabold tracking-tighter text-white drop-shadow-2xl mb-6">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-xl md:text-3xl font-medium text-gray-100 max-w-4xl drop-shadow-lg leading-relaxed">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* --- BANNER FOTO CORREGIDO (Error 3) --- */}
            {section.type === 'full_banner' && (
              <div className="relative w-full h-[60vh] min-h-[500px] md:h-[700px] overflow-hidden group">
                <Image
                  src={section.image_url}
                  alt={section.title}
                  fill
                  className="object-cover"
                  // ✅ SOLUCIÓN AL WARNING DE NEXT.JS
                  sizes="100vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 md:pb-32 px-4 text-center z-10">
                  <h2 className={`text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg mb-6 ${section.text_color === 'light' ? 'text-white' : 'text-gray-900'}`}>
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className={`text-xl md:text-2xl font-medium max-w-3xl leading-relaxed drop-shadow-md ${section.text_color === 'light' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* --- IMAGE LEFT CORREGIDO (Error 3) --- */}
            {section.type === 'image_left' && (
              <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-24">
                <div className="w-full md:w-1/2 relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image 
                    src={section.image_url} 
                    alt={section.title} 
                    fill 
                    className="object-cover"
                    // ✅ SOLUCIÓN: En móvil es 100vw, en escritorio es 50vw (600px)
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
                <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                  <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{section.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
                </div>
              </div>
            )}

            {/* --- IMAGE RIGHT CORREGIDO (Error 3) --- */}
            {section.type === 'image_right' && (
              <div className="max-w-[1200px] mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-10 md:gap-24">
                <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                  <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{section.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
                </div>
                <div className="w-full md:w-1/2 relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image 
                    src={section.image_url} 
                    alt={section.title} 
                    fill 
                    className="object-cover"
                    // ✅ SOLUCIÓN
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </section>
  );
}
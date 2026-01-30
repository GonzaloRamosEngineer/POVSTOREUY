'use client';

import AppImage from '@/components/ui/AppImage';

// Definimos los tipos exactos y los exportamos para usarlos en page.tsx
export type StoryBlock = 
  | { type: 'full_video'; image_url: string; video_url?: string; title?: string; subtitle?: string; description?: string; text_color?: 'light'|'dark' }
  | { type: 'image_left'; image_url: string; title: string; description: string; text_color?: 'light'|'dark' }
  | { type: 'image_right'; image_url: string; title: string; description: string; text_color?: 'light'|'dark' }
  | { type: 'full_banner'; image_url: string; title?: string; description?: string; text_color?: 'light'|'dark' };

export default function DynamicStoryRenderer({ content }: { content: StoryBlock[] }) {
  if (!content || !Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="flex flex-col w-full bg-white">
      {content.map((block, idx) => {
        
        // --- BLOQUE 1: VIDEO FULL PANTALLA ---
        if (block.type === 'full_video') {
          const videoSrc = block.video_url || block.image_url;
          // Si el texto es 'light', usamos blanco. Si es 'dark' o indefinido, usamos negro (para fondos claros)
          // Nota: En videos full screen, generalmente 'light' es mejor por el overlay oscuro.
          const isLight = block.text_color === 'light' || !block.text_color; 

          return (
            <div key={idx} className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden bg-black">
              <video 
                src={videoSrc} 
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                autoPlay 
                loop 
                muted 
                playsInline 
              />
              {/* Gradiente sutil para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 md:pb-32 px-4 text-center z-10">
                {block.title && (
                  <h2 className={`text-4xl md:text-7xl font-extrabold tracking-tighter mb-4 ${isLight ? 'text-white' : 'text-gray-900'}`}>
                    {block.title}
                  </h2>
                )}
                {block.description && (
                  <p className={`text-lg md:text-2xl max-w-3xl font-medium leading-relaxed ${isLight ? 'text-gray-100' : 'text-gray-800'}`}>
                    {block.description}
                  </p>
                )}
              </div>
            </div>
          );
        }

        // --- BLOQUE 2: BANNER FULL (Imagen estática gigante) ---
        if (block.type === 'full_banner') {
          const isLight = block.text_color === 'light';
          return (
            <div key={idx} className="relative w-full h-[60vh] md:h-[80vh] bg-gray-100">
              <div className="absolute inset-0">
                <AppImage 
                  src={block.image_url} 
                  alt={block.title || 'Banner'} 
                  className="w-full h-full object-cover" 
                />
              </div>
              {(block.title || block.description) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 bg-black/10">
                  {block.title && <h2 className={`text-4xl md:text-6xl font-bold mb-4 ${isLight ? 'text-white' : 'text-gray-900'}`}>{block.title}</h2>}
                  {block.description && <p className={`text-xl md:text-2xl max-w-2xl ${isLight ? 'text-white' : 'text-gray-800'}`}>{block.description}</p>}
                </div>
              )}
            </div>
          );
        }

        // --- BLOQUE 3: IMAGEN IZQUIERDA - TEXTO DERECHA ---
        if (block.type === 'image_left') {
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] bg-white">
              <div className="relative h-[400px] md:h-auto w-full">
                <AppImage src={block.image_url} alt={block.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center p-12 md:p-24 space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {block.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {block.description}
                </p>
              </div>
            </div>
          );
        }

        // --- BLOQUE 4: TEXTO IZQUIERDA - IMAGEN DERECHA ---
        if (block.type === 'image_right') {
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] bg-white">
              {/* En móvil la imagen va primero visualmente */}
              <div className="relative h-[400px] md:h-auto w-full md:order-2">
                <AppImage src={block.image_url} alt={block.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center p-12 md:p-24 space-y-6 md:order-1">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {block.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {block.description}
                </p>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
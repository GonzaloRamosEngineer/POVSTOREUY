'use client';

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export default function ProductGallery({ images = [], productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Protección: Si no hay imágenes, no mostramos nada para evitar errores
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon name="PhotoIcon" size={48} className="text-gray-300" />
      </div>
    );
  }

  // Aseguramos que el índice no se salga de rango
  const safeIndex = selectedIndex >= images.length ? 0 : selectedIndex;
  const selectedImage = images[safeIndex];

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  return (
    <div className="space-y-4 select-none">
      {/* --- Visor Principal --- */}
      <div 
        className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden aspect-square group shadow-sm z-10"
        onMouseLeave={() => setIsZoomed(false)}
      >
        {selectedImage.type === 'video' ? (
          // Vista de Video
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
             {/* Aquí podrías poner un iframe real de YouTube si la URL lo permite */}
             <div className="text-center p-6">
                <a href={selectedImage.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group/video">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 group-hover/video:scale-110 transition-transform">
                        <Icon name="PlayCircleIcon" size={32} className="text-white ml-1" variant="solid" />
                    </div>
                    <p className="text-sm text-gray-900 font-bold">Ver Video Externo</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedImage.url}</p>
                </a>
             </div>
          </div>
        ) : (
          // Vista de Imagen con Zoom
          <div
            className={`relative w-full h-full cursor-zoom-in overflow-hidden`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <AppImage
              // EL FIX IMPORTANTE ESTÁ AQUÍ: "key" fuerza la actualización
              key={selectedImage.id} 
              src={selectedImage.url}
              alt={selectedImage.alt}
              className={`object-contain w-full h-full transition-transform duration-500 ease-in-out ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
            />
          </div>
        )}

        {/* Flechas de navegación (Solo si hay más de 1 imagen) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 z-20"
            >
              <Icon name="ChevronLeftIcon" size={24} className="text-gray-800" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 z-20"
            >
              <Icon name="ChevronRightIcon" size={24} className="text-gray-800" />
            </button>
            
            {/* Contador */}
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full z-20">
              <span className="text-xs font-medium text-white">
                {safeIndex + 1} / {images.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* --- Carrusel de Miniaturas (Thumbnails) --- */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setSelectedIndex(index);
                setIsZoomed(false);
              }}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === safeIndex
                  ? 'border-blue-600 opacity-100 ring-2 ring-blue-100'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
              }`}
            >
              {image.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Icon name="VideoCameraIcon" size={20} className="text-gray-500" />
                </div>
              ) : (
                <AppImage
                  src={image.url}
                  alt={`Thumb ${index}`}
                  className="object-cover w-full h-full"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
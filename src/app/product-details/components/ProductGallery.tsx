'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon name="PhotoIcon" size={48} className="text-gray-300" />
      </div>
    );
  }

  const safeIndex = selectedIndex >= images.length ? 0 : selectedIndex;
  const selectedImage = images[safeIndex];

  // ── Lightbox ──
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  }, [images.length]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext]);

  // ── Swipe ──
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? lightboxNext() : lightboxPrev();
    }
    swipeStartX.current = null;
    swipeStartY.current = null;
  };

  // ── Flechas galería ──
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  };

  const lightboxImage = images[lightboxIndex];

  return (
    <>
      {/* ── Galería principal ── */}
      <div className="space-y-4 select-none">
        <div
          className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden h-[300px] md:aspect-square md:h-auto group shadow-sm cursor-zoom-in"
          onClick={() => selectedImage.type === 'image' && openLightbox(safeIndex)}
        >
          {/* Badge */}
          <div className="absolute top-4 right-4 z-30 pointer-events-none">
            <span className="px-4 py-1.5 bg-[#1ED760] text-black text-[13px] font-bold tracking-wide rounded-full shadow-md">
              ENVÍO GRATIS
            </span>
          </div>

          {selectedImage.type === 'video' ? (
            <div
              className="w-full h-full flex items-center justify-center bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group/video"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 group-hover/video:scale-110 transition-transform">
                  <Icon name="PlayCircleIcon" size={32} className="text-white ml-1" variant="solid" />
                </div>
                <p className="text-sm text-gray-900 font-bold">Ver Video Externo</p>
                <p className="text-xs text-gray-500 mt-1">{selectedImage.url}</p>
              </a>
            </div>
          ) : (
            <AppImage
              key={selectedImage.id}
              src={selectedImage.url}
              alt={selectedImage.alt || productName}
              className="object-contain w-full h-full"
            />
          )}

          {/* Hint ampliar — solo desktop en hover */}
          {selectedImage.type === 'image' && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <Icon name="MagnifyingGlassPlusIcon" size={13} />
              <span>Clic para ampliar</span>
            </div>
          )}

          {/* Flechas */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white/85 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-all z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Imagen anterior"
                type="button"
              >
                <Icon name="ChevronLeftIcon" size={24} className="text-gray-800" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white/85 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-all z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Imagen siguiente"
                type="button"
              >
                <Icon name="ChevronRightIcon" size={24} className="text-gray-800" />
              </button>

              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full z-20">
                <span className="text-xs font-medium text-white">
                  {safeIndex + 1} / {images.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Thumbnails desktop */}
        {images.length > 1 && (
          <div className="hidden md:grid grid-cols-5 gap-3">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === safeIndex
                    ? 'border-blue-600 opacity-100 ring-2 ring-blue-100'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                }`}
                aria-label={`Seleccionar imagen ${index + 1}`}
                type="button"
              >
                {image.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Icon name="VideoCameraIcon" size={20} className="text-gray-500" />
                  </div>
                ) : (
                  <AppImage
                    src={image.url}
                    alt={`Thumb ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-black/95"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Header fijo */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-white/50 text-sm tabular-nums">
              {lightboxIndex + 1} / {images.length}
            </span>
            <p className="text-white/80 text-sm font-medium truncate max-w-[50%] text-center">
              {productName}
            </p>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-all"
              aria-label="Cerrar"
              type="button"
            >
              <Icon name="XMarkIcon" size={20} className="text-white" />
            </button>
          </div>

          {/* Imagen central */}
          <div className="flex-1 flex items-center justify-center relative px-14 overflow-hidden">
            {images.length > 1 && (
              <button
                onClick={lightboxPrev}
                className="absolute left-2 md:left-5 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/25 border border-white/20 rounded-full transition-all z-10 flex-shrink-0"
                aria-label="Anterior"
                type="button"
              >
                <Icon name="ChevronLeftIcon" size={24} className="text-white" />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center py-4">
              {lightboxImage.type === 'video' ? (
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <Icon name="PlayCircleIcon" size={40} className="text-white ml-1" variant="solid" />
                  </div>
                  <p className="text-white font-bold">Abrir video</p>
                </a>
              ) : (
                <img
                  key={lightboxIndex}
                  src={lightboxImage.url}
                  alt={lightboxImage.alt || productName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  draggable={false}
                  style={{ userSelect: 'none', WebkitUserDrag: 'none' } as any}
                />
              )}
            </div>

            {images.length > 1 && (
              <button
                onClick={lightboxNext}
                className="absolute right-2 md:right-5 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/25 border border-white/20 rounded-full transition-all z-10 flex-shrink-0"
                aria-label="Siguiente"
                type="button"
              >
                <Icon name="ChevronRightIcon" size={24} className="text-white" />
              </button>
            )}
          </div>

          {/* Footer: thumbnails */}
          {images.length > 1 && (
            <div className="flex-shrink-0 pb-6 pt-3 border-t border-white/10">
              <div className="flex justify-center gap-2 px-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                      idx === lightboxIndex
                        ? 'border-white opacity-100 scale-110'
                        : 'border-white/20 opacity-40 hover:opacity-70'
                    }`}
                  >
                    {img.type === 'video' ? (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Icon name="VideoCameraIcon" size={14} className="text-white" />
                      </div>
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-white/25 text-[11px] mt-3 hidden md:block">
                ← → para navegar · ESC para cerrar
              </p>
              <p className="text-center text-white/25 text-[11px] mt-3 md:hidden">
                Deslizá para navegar
              </p>
            </div>
          )}
        </div>
      , document.body)}
    </>
  );
}
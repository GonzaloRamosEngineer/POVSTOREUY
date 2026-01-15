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

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative bg-background rounded-lg overflow-hidden aspect-square">
        {selectedImage.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <Icon name="PlayCircleIcon" size={64} className="text-primary mx-auto" variant="solid" />
              <p className="text-sm text-muted-foreground">Muestra de video 4K</p>
            </div>
          </div>
        ) : (
          <div
            className={`relative w-full h-full cursor-zoom-in transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <AppImage
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-card/90 hover:bg-card rounded-full transition-smooth focus-ring"
          aria-label="Imagen anterior"
        >
          <Icon name="ChevronLeftIcon" size={24} className="text-foreground" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-card/90 hover:bg-card rounded-full transition-smooth focus-ring"
          aria-label="Siguiente imagen"
        >
          <Icon name="ChevronRightIcon" size={24} className="text-foreground" />
        </button>

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-card/90 rounded-full">
          <span className="text-xs font-medium text-foreground">
            {selectedIndex + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => {
              setSelectedIndex(index);
              setIsZoomed(false);
            }}
            className={`relative aspect-square rounded-md overflow-hidden transition-smooth focus-ring ${
              index === selectedIndex
                ? 'ring-2 ring-primary' :'ring-1 ring-border hover:ring-primary/50'
            }`}
          >
            {image.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Icon name="PlayCircleIcon" size={24} className="text-primary" variant="solid" />
              </div>
            ) : (
              <AppImage
                src={image.url}
                alt={`${productName} miniatura ${index + 1}`}
                className="object-cover w-full h-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
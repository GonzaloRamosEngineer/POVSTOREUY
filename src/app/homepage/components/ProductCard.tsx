'use client';

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt: string;
  features: string[];
  stockCount: number;
  badge?: string;
  onAddToCart: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  alt,
  features,
  stockCount,
  badge,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const isLowStock = stockCount <= 5;

  if (!isHydrated) {
    return (
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
        <div className="relative h-80 bg-gray-800 overflow-hidden">
          <AppImage
            src={image}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-heading font-bold text-white">{name}</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold text-neon-cyan">${price.toLocaleString('es-UY')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-neon-cyan shadow-xl hover:shadow-neon-glow-strong transition-all duration-300 transform hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/0 via-transparent to-primary/0 group-hover:from-neon-cyan/10 group-hover:to-primary/10 transition-all duration-500 pointer-events-none" />
      
      {/* Image Section */}
      <div className="relative h-80 bg-gray-800 overflow-hidden">
        <AppImage
          src={image}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {badge && (
            <span className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-primary text-white text-xs font-bold rounded-full shadow-neon-glow animate-pulse-subtle uppercase tracking-wider">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="px-4 py-2 bg-gradient-to-r from-neon-orange to-red-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wider">
              -{discount}% OFF
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        {isLowStock && (
          <div className="absolute bottom-4 right-4 px-4 py-2 bg-neon-orange/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg animate-pulse-subtle z-10">
            <Icon name="ExclamationTriangleIcon" size={16} variant="solid" />
            <span>ÚLTIMAS {stockCount} UNIDADES</span>
          </div>
        )}

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="bg-neon-cyan/80 backdrop-blur-sm rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Icon name="PlayIcon" size={24} className="text-white" variant="solid" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative p-6 space-y-4">
        <h3 className="text-2xl font-heading font-bold text-white group-hover:text-neon-cyan transition-colors">{name}</h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-mono font-bold text-neon-cyan drop-shadow-glow">
            ${price.toLocaleString('es-UY')}
          </span>
          {originalPrice && (
            <span className="text-lg font-mono text-gray-500 line-through">
              ${originalPrice.toLocaleString('es-UY')}
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start gap-2 text-sm text-gray-300 transform transition-all duration-300"
              style={{ 
                transitionDelay: isHovered ? `${index * 50}ms` : '0ms',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
            >
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-success/30">
                <Icon name="CheckIcon" size={14} className="text-success" variant="solid" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => onAddToCart(id)}
            className="w-full px-6 py-4 bg-gradient-to-r from-neon-cyan to-primary hover:from-primary hover:to-neon-cyan text-white text-center font-bold rounded-lg transition-all shadow-neon-glow hover:shadow-neon-glow-strong transform hover:scale-105 focus-ring uppercase tracking-wide"
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="ShoppingCartIcon" size={20} variant="solid" />
              <span>Comprar Ahora</span>
            </div>
          </button>
          <button
            onClick={() => onViewDetails(id)}
            className="w-full px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white text-center font-medium rounded-lg transition-all border border-gray-700 hover:border-neon-cyan focus-ring"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
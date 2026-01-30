'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  onViewDetails?: (productId: string) => void;
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
}: ProductCardProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const isLowStock = stockCount <= 5;
  
  const productUrl = `/products/${id}`; 

  if (!isHydrated) {
    return (
      <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-xl">
        <div className="relative h-80 bg-neutral-800 overflow-hidden">
          <AppImage
            src={image}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 space-y-4">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">{name}</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold text-red-500">${price.toLocaleString('es-UY')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-red-600/50 shadow-xl hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effect Trasero */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-transparent to-red-900/0 group-hover:from-red-600/5 group-hover:to-red-900/5 transition-all duration-500 pointer-events-none" />
      
      {/* Image Section */}
      <Link href={productUrl} className="block relative h-80 bg-neutral-800 overflow-hidden cursor-pointer">
        <AppImage
          src={image}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
        
        {/* Badges simplificados */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {badge && (
            <span className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg shadow-lg uppercase tracking-wider">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-lg uppercase tracking-wider">
              -{discount}% OFF
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        {isLowStock && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse z-10">
            <Icon name="ExclamationTriangleIcon" size={14} variant="solid" />
            <span>ÚLTIMAS {stockCount}</span>
          </div>
        )}

        {/* Action Overlay Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="bg-red-600 rounded-full p-4 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.6)]">
            <Icon name="EyeIcon" size={24} className="text-white" variant="solid" />
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="relative p-6 space-y-5 bg-neutral-900">
        <Link href={productUrl} className="block">
           {/* Título más grande en desktop para mejor jerarquía visual */}
           <h3 className="text-2xl md:text-3xl font-heading font-bold text-white group-hover:text-red-500 transition-colors duration-300 cursor-pointer leading-tight">
             {name}
           </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-mono font-bold text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.3)]">
            ${price.toLocaleString('es-UY')}
          </span>
          {originalPrice && (
            <span className="text-sm font-mono text-neutral-500 line-through decoration-neutral-600">
              ${originalPrice.toLocaleString('es-UY')}
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 pt-2">
          {features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start gap-2.5 text-sm text-neutral-300 transform transition-all duration-300"
              style={{ 
                transitionDelay: isHovered ? `${index * 50}ms` : '0ms',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
            >
              <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-700 text-red-500">
                <Icon name="CheckIcon" size={12} variant="solid" />
              </div>
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => onAddToCart(id)}
            className="w-full px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white text-center font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Icon name="ShoppingCartIcon" size={18} variant="solid" />
            <span>Comprar Ahora</span>
          </button>
          
          <Link
            href={productUrl}
            className="block w-full px-6 py-3 bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white text-center font-medium rounded-xl transition-all border border-neutral-700 hover:border-neutral-500"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
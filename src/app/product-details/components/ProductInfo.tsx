'use client';

import { MarkdownText } from './ProductDetailsInteractive';
import Icon from '@/components/ui/AppIcon';

interface ProductInfoProps {
  name: string;
  model: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockCount?: number;
  description: string;
}

export default function ProductInfo({
  name,
  model,
  price,
  originalPrice,
  rating,
  reviewCount,
  stockStatus,
  stockCount,
  description,
}: ProductInfoProps) {
  
  // --- Función de Scroll suave hasta las reseñas ---
  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
      const offset = 100; // Ajuste para que no quede pegado al borde superior (considerando el header sticky)
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = reviewsSection.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // --- Lógica de Ahorro y Precios ---
  const hasDiscount = originalPrice && originalPrice > price;
  const savingsAmount = hasDiscount ? (originalPrice as number) - price : 0;
  const savingsPercentage = hasDiscount 
    ? Math.round((savingsAmount / (originalPrice as number)) * 100) 
    : 0;
    
  const price30Days = Math.round(originalPrice ? originalPrice * 1.02 : price * 1.10);

  const stockMessages = {
    'in-stock': 'En stock',
    'low-stock': `¡Solo quedan ${stockCount} unidades!`,
    'out-of-stock': 'Agotado',
  };

  const stockColors = {
    'in-stock': 'text-green-600',
    'low-stock': 'text-orange-600',
    'out-of-stock': 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* 1. Badge de Stock y Modelo */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-gray-200">
          {model || 'Original'}
        </span>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${stockStatus === 'low-stock' ? 'bg-orange-50' : ''} ${stockColors[stockStatus]}`}>
          <Icon name={stockStatus === 'out-of-stock' ? 'XCircleIcon' : 'CheckCircleIcon'} size={14} variant="solid" />
          <span className="text-xs font-bold tracking-tight">{stockMessages[stockStatus]}</span>
        </div>
      </div>

      {/* 2. Título del Producto */}
      <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
        {name}
      </h1>

      {/* 3. Rating y Opiniones con LINK de SCROLL */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Icon
              key={i}
              name="StarIcon"
              size={18}
              variant={i < Math.floor(rating) ? 'solid' : 'outline'}
              className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-gray-500">
          {rating.toFixed(1)} <span className="mx-1">•</span> 
          {/* BOTÓN ACTUALIZADO CON ONCLICK */}
          <button 
            onClick={scrollToReviews}
            className="underline hover:text-red-600 transition-colors cursor-pointer decoration-gray-300 hover:decoration-red-600 underline-offset-4"
          >
            {reviewCount} opiniones
          </button>
        </span>
      </div>

      {/* 4. Bloque de Precios y Ahorro */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-black text-red-600 tracking-tighter">
            ${price.toLocaleString('es-UY')}
          </span>

          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-xl text-gray-400 line-through decoration-gray-400 decoration-1">
                ${originalPrice?.toLocaleString('es-UY')}
              </span>
              <span className="bg-red-600 text-white text-[11px] font-black px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                -${savingsAmount.toLocaleString('es-UY')} (-{savingsPercentage}%)
              </span>
            </div>
          )}
        </div>

        {hasDiscount && (
          <p className="text-[13px] text-gray-500 font-medium tracking-tight">
            Precio más bajo en los últimos 30 días: 
            <span className="line-through ml-1.5 opacity-70">${price30Days.toLocaleString('es-UY')}</span>
          </p>
        )}
      </div>

      {/* 5. Descripción */}
      {description && (
        <div className="pt-2 border-t border-gray-100">
          <MarkdownText text={description} className="text-base text-gray-600 leading-relaxed" />
        </div>
      )}

      {/* 6. Atributos Destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-red-100 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
            <Icon name="VideoCameraIcon" size={18} variant="solid" />
          </div>
          <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Grabación 4K UHD</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-red-100 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
            <Icon name="BoltIcon" size={18} variant="solid" />
          </div>
          <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Estabilización EIS</span>
        </div>
      </div>
    </div>
  );
}
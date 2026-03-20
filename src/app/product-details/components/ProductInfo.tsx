'use client';

import Icon from '@/components/ui/AppIcon';

interface ProductInfoProps {
  name: string;
  model: string;
  price: number;
  originalPrice?: number | null;
  cashPrice?: number | null;
  cardPrice?: number | null;
  rating: number;
  reviewCount: number;
  description: string;
  resumen?: string;
  mode?: 'full' | 'header' | 'pricing';
}

export default function ProductInfo({
  name,
  model,
  price,
  originalPrice,
  cashPrice,
  cardPrice,
  rating,
  reviewCount,
  description,
  resumen,
  mode = 'full',
}: ProductInfoProps) {
  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
      const offset = 100;
      const elementPosition =
        reviewsSection.getBoundingClientRect().top -
        document.body.getBoundingClientRect().top -
        offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  const displayCashPrice = cashPrice || price;
  const displayCardPrice = cardPrice || price;
  const showDualPricing = !!(cashPrice && cardPrice && cashPrice < cardPrice);
  const transferSavings = showDualPricing ? displayCardPrice - displayCashPrice : 0;

  const showHeader = mode === 'full' || mode === 'header';
  const showPricing = mode === 'full' || mode === 'pricing';

  return (
    <div className="space-y-3">
      {showHeader && (
        <>
          <div className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
            {model || 'SJCAM SERIES'}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {name}
          </h1>

          <div className="flex items-center gap-2 pb-2">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="StarIcon"
                  size={16}
                  variant={i < Math.floor(rating) ? 'solid' : 'outline'}
                  className={i >= Math.floor(rating) ? 'text-gray-300' : ''}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {rating.toFixed(1)} •{' '}
              <button
                onClick={scrollToReviews}
                className="hover:text-blue-600 hover:underline transition-colors"
              >
                {reviewCount} opiniones
              </button>
            </span>
          </div>

          {resumen && (
            <div className="py-4 border-y border-gray-100 my-4">
              <p className="text-base text-gray-600 leading-relaxed font-medium italic">
                {resumen}
              </p>
            </div>
          )}
        </>
      )}

      {showPricing && (
        <div className={showHeader ? 'pt-4 flex flex-col gap-2' : 'flex flex-col gap-2'}>
          {showDualPricing ? (
            <>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#10b981] tracking-tight">
                    $U {displayCashPrice.toLocaleString('es-UY')}
                  </span>
                  <span className="text-[11px] font-black text-[#10b981] bg-[#10b981]/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Ahorrás ${transferSavings.toLocaleString('es-UY')}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#10b981] mt-0.5 block">
                  Pagando con transferencia bancaria
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">
                    $U {displayCardPrice.toLocaleString('es-UY')}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    con tarjeta / MercadoPago
                  </span>
                </div>
                {originalPrice && originalPrice > displayCardPrice && (
                  <div className="text-sm font-bold text-gray-400 line-through mt-0.5 decoration-gray-400">
                    $U {originalPrice.toLocaleString('es-UY')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {originalPrice && originalPrice > price && (
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base text-gray-400 line-through">
                    $U {originalPrice.toLocaleString('es-UY')}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                    Ahorrás $U {(originalPrice - price).toLocaleString('es-UY')}
                  </span>
                </div>
              )}
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                $U {price.toLocaleString('es-UY')}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
'use client';

import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL DICCIONARIO
import { globalMessages } from '@/messages/globalMessages';

interface AccessoryCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt: string;
  stockCount: number;
  rating?: number;
  badge?: string;
  features?: string[];
  onAddToCart: (productId: string) => void;
}

export default function AccessoryCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  alt,
  stockCount,
  rating = 5,
  badge,
  features = [],
  onAddToCart,
}: AccessoryCardProps) {
  const isOutOfStock = stockCount <= 0;
  const isLowStock = !isOutOfStock && stockCount <= 5;
  const { accessoryCard } = globalMessages;

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const whatsappUrl = `https://wa.me/59896482949?text=${encodeURIComponent(
    accessoryCard.whatsappTemplate(name)
  )}`;

  const productUrl = `/products/${slug || id}`;
  const topFeatures = (features || []).filter(Boolean).slice(0, 2);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-200 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]">
      {/* ---------- IMAGEN (frame uniforme) ---------- */}
      <Link href={productUrl} className="relative block">
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100/70 p-8">
          <AppImage
            src={image}
            alt={alt}
            className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          />

          {/* Chip de descuento */}
          {discount > 0 && !isOutOfStock && (
            <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
              −{discount}%
            </span>
          )}

          {/* Badge editorial (ej. 4K READY) */}
          {badge && !isOutOfStock && (
            <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 ring-1 ring-sky-500/30 backdrop-blur-sm">
              {badge}
            </span>
          )}

          {/* Overlay "ver detalles" en hover */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-gray-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-900 shadow-lg backdrop-blur-sm">
              {accessoryCard.actions.viewDetails}
              <Icon name="ArrowRightIcon" size={12} />
            </span>
          </div>

          {/* Velo agotado */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/85 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
                <Icon name="XCircleIcon" size={13} variant="solid" />
                {accessoryCard.badges.outOfStock}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ---------- CONTENIDO ---------- */}
      <div className="flex flex-1 flex-col p-6">
        {/* Rating + stock bajo */}
        <div className="mb-2.5 flex items-center gap-2">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="StarIcon"
                size={14}
                variant={i < Math.floor(rating) ? 'solid' : 'outline'}
                className={i >= Math.floor(rating) ? 'text-gray-200' : ''}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-400">{rating.toFixed(1)}</span>

          {isLowStock && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-500/25">
              <Icon name="ExclamationTriangleIcon" size={11} variant="solid" />
              Últimas {stockCount}
            </span>
          )}
        </div>

        {/* Título */}
        <Link href={productUrl}>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600">
            {name}
          </h3>
        </Link>

        {/* Features */}
        {topFeatures.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {topFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-gray-500">
                <Icon
                  name="CheckCircleIcon"
                  size={15}
                  variant="solid"
                  className="mt-0.5 shrink-0 text-red-500/80"
                />
                <span className="line-clamp-1">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Empuja el footer al fondo: alinea precios/botón en toda la grilla */}
        <div className="flex-1" />

        {/* Precio + acción */}
        <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-5">
          <div className="flex flex-col">
            {originalPrice && originalPrice > price && (
              <span className="mb-0.5 text-xs text-gray-400 line-through">
                $U {originalPrice.toLocaleString('es-UY')}
              </span>
            )}
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              $U {price.toLocaleString('es-UY')}
            </span>
          </div>

          {isOutOfStock ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Icon name="BellAlertIcon" size={16} />
              {accessoryCard.actions.notifyMe}
            </a>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(id);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black hover:shadow-lg active:scale-95"
            >
              <Icon name="ShoppingBagIcon" size={16} variant="solid" />
              {accessoryCard.actions.add}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

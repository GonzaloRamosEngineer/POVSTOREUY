'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import ProductStickyNav from './ProductStickyNav';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { upsertCartItem } from '@/lib/cart';
import Icon from '@/components/ui/AppIcon';
import AccessoriesCarousel from '@/components/common/AccessoriesCarousel';
import {
  buildProductsLookup,
  computePackEffectiveStock,
  type ProductStockLike,
} from '@/lib/packs/computePackStock';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
}

type PackBadge = {
  text: string;
  variant: 'red' | 'green' | 'orange' | 'blue';
};

interface ProductPackComponent {
  product_id: string;
  quantity: number;
  role?: 'primary' | 'component';
}

interface ProductPack {
  id: string;
  name: string;
  tagline: string;
  price: number;
  original_price: number | null;
  cash_price?: number | null;
  card_price?: number | null;
  includes: string[];
  images?: string[];
  components?: ProductPackComponent[];
  badge?: PackBadge;
}

interface ProductData {
  id: string;
  name: string;
  model: string;
  description: string;
  resumen?: string;
  price: number;
  original_price: number | null;
  cash_price?: number | null;
  card_price?: number | null;
  image_url: string;
  stock_count: number;
  features: string[] | string;
  is_active: boolean;
  packs?: ProductPack[];
  rating?: number;
  review_count?: number;
  shipping_info?: string;
  warranty_info?: string;
  payment_info?: string;
}

interface ProductInteractiveProps {
  productInitial: ProductData;
  galleryInitial: GalleryImage[];
  addonsDictionary?: any[];
}

function TrustAccordion({
  shippingInfo,
  warrantyInfo,
  paymentInfo,
}: {
  shippingInfo?: string;
  warrantyInfo?: string;
  paymentInfo?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpen((prev) => (prev === id ? null : id));
  };

  const items = [
    {
      id: 'returns',
      title: 'Garantía y Devoluciones',
      icon: 'ArrowUturnLeftIcon',
      content:
        warrantyInfo || 'Tenés 30 días para devolver el producto si no cumple con tus expectativas.',
    },
    {
      id: 'shipping',
      title: 'Política de Envíos',
      icon: 'TruckIcon',
      content:
        shippingInfo || 'Enviamos a todo Uruguay con seguimiento para que sepas siempre dónde está tu pedido.',
    },
    {
      id: 'payments',
      title: 'Medios de Pago',
      icon: 'CreditCardIcon',
      content:
        paymentInfo || 'Tus pagos están protegidos mediante sistemas de seguridad y cifrado.',
    },
  ];

  return (
    <div className="mt-6 border-t border-gray-200">
      {items.map((item) => {
        const isOpen = open === item.id;

        return (
          <div key={item.id} className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full py-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Icon name={item.icon as any} size={18} className="text-blue-600" />
                <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </span>
              </div>

              <Icon
                name="ChevronDownIcon"
                size={18}
                className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div
                className="pb-4 pl-8 text-sm text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getBadgeClasses(variant?: PackBadge['variant']) {
  switch (variant) {
    case 'green':
      return 'bg-green-500 text-black';
    case 'orange':
      return 'bg-orange-500 text-white';
    case 'blue':
      return 'bg-blue-500 text-white';
    case 'red':
    default:
      return 'bg-red-500 text-white';
  }
}

export default function ProductDetailsInteractive({
  productInitial,
  galleryInitial,
  addonsDictionary = [],
}: ProductInteractiveProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const product = productInitial;

  const [dbPacks, setDbPacks] = useState<ProductPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<ProductPack | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [componentsLookup, setComponentsLookup] = useState<Map<string, ProductStockLike>>(new Map());

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();

      return {
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchPacks() {
      const { data } = await supabase.from('products').select('packs').eq('id', product.id).single();

      let loadedPacks: any = data?.packs || [];

      if (typeof loadedPacks === 'string') {
        try {
          loadedPacks = JSON.parse(loadedPacks);
        } catch (e) {}
      }

      if (Array.isArray(loadedPacks) && loadedPacks.length > 0) {
        const normalizedPacks = loadedPacks.map((pack: any) => ({
          ...pack,
          cash_price: pack.cash_price ? Number(pack.cash_price) : null,
          card_price: pack.card_price ? Number(pack.card_price) : null,
          images: Array.isArray(pack.images) ? pack.images : [],
          badge: pack.badge || { text: '', variant: 'red' },
        }));

        setDbPacks(normalizedPacks);

        const urlPackId = searchParams?.get('pack');
        const initialPack = urlPackId
          ? normalizedPacks.find((p: any) => p.id === urlPackId)
          : null;

        setSelectedPack(initialPack || normalizedPacks[0]);
      }
    }

    fetchPacks();
  }, [product.id, supabase, searchParams]);

  // Carga el lookup de productos para calcular stock derivado de los packs.
  // Solo trae los componentes referenciados por los packs cargados (query acotada).
  useEffect(() => {
    if (dbPacks.length === 0) return;
    const componentIds = new Set<string>();
    for (const pack of dbPacks) {
      for (const c of pack.components || []) {
        if (c?.product_id) componentIds.add(c.product_id);
      }
    }
    if (componentIds.size === 0) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, stock_count, is_active')
        .in('id', Array.from(componentIds));
      if (cancelled || !data) return;
      const rows: ProductStockLike[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock_count: Number(p.stock_count ?? 0),
        is_active: p.is_active !== false,
      }));
      // Incluimos el producto que estamos viendo con su stock actual (puede ser el primary de varios packs).
      rows.push({
        id: product.id,
        name: product.name,
        stock_count: Number(product.stock_count ?? 0),
        is_active: product.is_active !== false,
      });
      setComponentsLookup(buildProductsLookup(rows));
    })();
    return () => {
      cancelled = true;
    };
  }, [dbPacks, supabase, product.id, product.name, product.stock_count, product.is_active]);

  useEffect(() => {
    const urlPackId = searchParams?.get('pack');

    if (dbPacks.length > 0) {
      if (urlPackId) {
        const foundPack = dbPacks.find((p) => p.id === urlPackId);
        if (foundPack) {
          setSelectedPack(foundPack);
        }
      } else {
        setSelectedPack(dbPacks[0]);
      }
    }
  }, [searchParams, dbPacks]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedPack?.id]);

  const currentStock = useMemo(() => {
    // Producto simple (sin pack seleccionado): stock crudo del producto.
    if (!selectedPack) return Math.max(0, Number(product.stock_count ?? 0));

    // Pack: stock derivado de sus componentes. Si todavía no cargó el lookup,
    // devolvemos 0 conservadoramente para no permitir compras prematuras.
    if (componentsLookup.size === 0) return 0;
    return computePackEffectiveStock(selectedPack, componentsLookup).stock;
  }, [selectedPack, product.stock_count, componentsLookup]);

  const dynamicGallery = useMemo(() => {
    if (selectedPack && selectedPack.images && selectedPack.images.length > 0) {
      const packImages: GalleryImage[] = selectedPack.images.map((url, i) => ({
        id: `pack-${selectedPack.id}-${i}`,
        url,
        alt: `${product.name} - ${selectedPack.name}`,
        type: 'image' as const,
      }));

      return [...packImages, ...galleryInitial];
    }

    return galleryInitial;
  }, [selectedPack, galleryInitial, product.name]);

  const currentDisplayPrice = selectedPack ? selectedPack.price : Number(product.price);
  const currentOriginalPrice = selectedPack ? selectedPack.original_price : product.original_price;
  const hasDiscount = currentOriginalPrice ? currentOriginalPrice > currentDisplayPrice : false;

  const currentName = selectedPack ? `${product.name} - ${selectedPack.name}` : product.name;
  const currentImage = dynamicGallery[0]?.url || product.image_url;
  const currentRating = product.rating || 5;
  const currentReviewCount = product.review_count || 0;

  const handlePackSelect = (pack: ProductPack) => {
    setSelectedPack(pack);
    if (topRef.current) {
      const offset = 80;
      const top = topRef.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleAddToCart = () => {
    if (currentStock <= 0) return;

    setIsAdding(true);

    let cartProductName = product.name;

    if (selectedPack) {
      cartProductName = `${product.name} - ${selectedPack.name}`;
    }

    const isPack = Boolean(selectedPack);
    const cartItemId = isPack ? `pack::${product.id}::${selectedPack!.id}` : product.id;

    upsertCartItem({
      id: cartItemId,
      name: cartProductName,
      model: product.model,
      price: currentDisplayPrice,
      quantity,
      image: dynamicGallery[0]?.url || product.image_url,
      alt: cartProductName,
      stock: currentStock,
      ...(isPack
        ? {
            type: 'pack',
            parent_product_id: product.id,
            pack_id: selectedPack!.id,
            price_preview: currentDisplayPrice,
          }
        : {
            type: 'product',
            product_id: product.id,
          }),
    } as any);

    window.dispatchEvent(new Event('cart-updated'));

    setTimeout(() => {
      router.push('/shopping-cart');
    }, 200);
  };

  if (product.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Este producto no está disponible actualmente.
      </div>
    );
  }

  return (
    <>
      <ProductStickyNav
        productName={currentName}
        productPrice={currentDisplayPrice}
        productImage={currentImage}
        averageRating={currentRating}
        totalReviews={currentReviewCount}
      />

      {mounted && hasDiscount && (
        <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen mb-6">
          <div className="w-full bg-neutral-950 border-b border-white/5 py-3 px-4 flex justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.20),transparent_55%)] pointer-events-none" />

            <div className="flex flex-row items-center gap-3 sm:gap-4 relative z-10">
              <Icon name="ClockIcon" size={16} className="text-red-500 animate-pulse hidden sm:block" />

              <span className="font-bold text-gray-200 uppercase tracking-widest text-[10px] sm:text-xs drop-shadow-sm">
                La oferta termina hoy:
              </span>

              <div className="flex items-center gap-1.5">
                <span className="font-black bg-red-600 text-white px-2 py-0.5 rounded shadow-sm text-[11px] sm:text-xs min-w-[24px] text-center leading-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-red-500 font-bold text-xs">:</span>
                <span className="font-black bg-red-600 text-white px-2 py-0.5 rounded shadow-sm text-[11px] sm:text-xs min-w-[24px] text-center leading-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-red-500 font-bold text-xs">:</span>
                <span className="font-black bg-red-600 text-white px-2 py-0.5 rounded shadow-sm text-[11px] sm:text-xs min-w-[24px] text-center leading-tight">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={topRef} className="max-w-[1200px] mx-auto px-4 lg:px-8 pt-0 pb-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12 lg:gap-16 items-start">
          {/* BLOQUE 1 mobile: Título + descripción */}
          <div className="order-1 lg:hidden bg-white">
            <ProductInfo
              name={currentName}
              model={product.model ?? ''}
              price={currentDisplayPrice}
              originalPrice={currentOriginalPrice ?? undefined}
              cashPrice={selectedPack ? selectedPack.cash_price : product.cash_price}
              cardPrice={selectedPack ? selectedPack.card_price : product.card_price}
              rating={currentRating}
              reviewCount={currentReviewCount}
              description={product.description}
              resumen={selectedPack?.tagline || product.resumen}
              mode="header"
            />
          </div>

          {/* BLOQUE 2 mobile: Galería */}
          <div className="order-2 lg:order-1 w-full lg:sticky lg:top-24 z-10 bg-white">
            <ProductGallery
              key={selectedPack?.id || 'main'}
              images={dynamicGallery}
              productName={product.name}
            />
          </div>

          {/* BLOQUE 3 mobile: Precio */}
          <div className="order-3 lg:hidden bg-white border-t border-gray-100 pt-4">
            <ProductInfo
              name={currentName}
              model={product.model ?? ''}
              price={currentDisplayPrice}
              originalPrice={currentOriginalPrice ?? undefined}
              cashPrice={selectedPack ? selectedPack.cash_price : product.cash_price}
              cardPrice={selectedPack ? selectedPack.card_price : product.card_price}
              rating={currentRating}
              reviewCount={currentReviewCount}
              description={product.description}
              resumen={selectedPack?.tagline || product.resumen}
              mode="pricing"
            />
          </div>

          {/* BLOQUE 4 mobile / Columna derecha desktop: Kits + CTA */}
          <div className="order-4 lg:order-2 space-y-6 md:space-y-8 relative z-20 bg-white">
            <div className="hidden lg:block">
              <ProductInfo
                name={currentName}
                model={product.model ?? ''}
                price={currentDisplayPrice}
                originalPrice={currentOriginalPrice ?? undefined}
                cashPrice={selectedPack ? selectedPack.cash_price : product.cash_price}
                cardPrice={selectedPack ? selectedPack.card_price : product.card_price}
                rating={currentRating}
                reviewCount={currentReviewCount}
                description={product.description}
                resumen={selectedPack?.tagline || product.resumen}
              />
            </div>

            {dbPacks.length > 0 && (
              <div className="pt-4 md:pt-6 border-t border-gray-100">
                <h3 className="font-black text-blue-800 text-[11px] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full" />
                  SELECCIONA TU KIT
                </h3>

                <div className="space-y-4">
                  {dbPacks.map((pack) => {
                    const isSelected = selectedPack?.id === pack.id;
                    const packHasDiscount = pack.original_price && pack.original_price > pack.price;

                    const packCashPrice = pack.cash_price || pack.price;
                    const packCardPrice = pack.card_price || pack.price;
                    const packHasDualPricing = !!(
                      pack.cash_price &&
                      pack.card_price &&
                      pack.cash_price < pack.card_price
                    );

                    return (
                      <div
                        key={pack.id}
                        className={`rounded-2xl border-2 transition-all duration-300 relative ${
                          isSelected
                            ? 'border-blue-600 bg-white shadow-lg'
                            : 'border-gray-200 bg-gray-50/50 hover:border-blue-200'
                        }`}
                      >
                        {pack.badge?.text && (
                          <div className="absolute -top-3 right-4 z-10">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${getBadgeClasses(
                                pack.badge.variant
                              )}`}
                            >
                              <Icon name="GiftIcon" size={10} />
                              {pack.badge.text}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePackSelect(pack)}
                          className="w-full p-4 md:p-5 text-left"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 flex gap-3">
                              <div
                                className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                  isSelected ? 'border-red-500' : 'border-gray-300'
                                }`}
                              >
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                              </div>
                              <div>
                                <span className="font-bold text-lg leading-tight text-gray-900 block mb-0.5">
                                  {pack.name}
                                </span>
                                {pack.tagline && (
                                  <p className="text-xs text-gray-500">{pack.tagline}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 flex flex-col items-end pt-1">
                              {packHasDualPricing ? (
                                <>
                                  <div className="flex flex-col items-end gap-1 mb-2">
                                    <span className="text-[9px] font-black text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                                      Ahorrás $U {(packCardPrice - packCashPrice).toLocaleString('es-UY')}
                                    </span>
                                    <div className="font-black text-[#10b981] text-xl md:text-2xl leading-none">
                                      $U {packCashPrice.toLocaleString('es-UY')}
                                    </div>
                                    <div className="text-[10px] font-bold text-[#10b981]">
                                      Transferencia bancaria
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <div className="font-black text-gray-900 text-sm sm:text-base leading-none">
                                      $U {packCardPrice.toLocaleString('es-UY')}
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-500">
                                      Tarjeta / MercadoPago
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="font-black text-gray-900 text-xl md:text-2xl leading-none">
                                  $U {pack.price.toLocaleString('es-UY')}
                                </div>
                              )}

                              {packHasDiscount && (
                                <div className="mt-1.5 text-xs text-gray-400 line-through">
                                  $U {pack.original_price?.toLocaleString('es-UY')}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            {pack.includes && pack.includes.length > 0 && (
                              <div className="border-t border-gray-100 bg-white px-5 pb-5 pt-4 rounded-b-2xl mx-1 mb-1">
                                <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4">
                                  ¿Qué incluye este kit?
                                </h4>

                                <div className="space-y-3">
                                  {pack.includes.map((itemId, idx) => {
                                    const itemData = addonsDictionary.find((a) => a.id === itemId);

                                    if (itemData) {
                                      return (
                                        <div
                                          key={itemId}
                                          className="flex items-center gap-3 p-2.5 rounded-xl border border-blue-100 bg-blue-50/20"
                                        >
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
                                            <Icon name="CheckIcon" size={12} />
                                          </div>
                                          <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0 shadow-sm">
                                            <img
                                              src={itemData.image_url}
                                              className="w-full h-full object-contain"
                                              alt=""
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                              {itemData.name}
                                            </div>
                                          </div>
                                          <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-100/50 px-2 py-1 rounded">
                                            Incluido
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={`${itemId}-${idx}`}
                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50"
                                      >
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 flex-shrink-0">
                                          <Icon name="CheckIcon" size={12} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-bold text-gray-700">
                                          {itemId}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 md:pt-6 border-t border-gray-100">
              {currentStock > 0 && (
                <div className="flex items-center gap-2 mb-5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl w-fit animate-pulse shadow-sm">
                  <span className="text-base leading-none">🔥</span>
                  <span className="text-[11px] sm:text-xs font-black text-red-600 uppercase tracking-widest">
                    ¡Últimas unidades en stock!
                  </span>
                </div>
              )}

              {currentStock > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-bold text-gray-800">Cantidad:</span>

                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      type="button"
                    >
                      <Icon name="MinusIcon" size={16} />
                    </button>

                    <div className="w-12 h-10 flex items-center justify-center font-black text-gray-900 bg-white border-x border-gray-200 text-sm">
                      {quantity}
                    </div>

                    <button
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      disabled={quantity >= currentStock}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      type="button"
                    >
                      <Icon name="PlusIcon" size={16} />
                    </button>
                  </div>

                  <span className="text-xs text-gray-500 font-medium">
                    ({currentStock} {currentStock === 1 ? 'disponible' : 'disponibles'})
                  </span>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0 || isAdding}
                className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-xl ${
                  currentStock <= 0
                    ? 'bg-gray-200 text-gray-400 shadow-none'
                    : 'bg-[#0066FF] hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]'
                }`}
                type="button"
              >
                {currentStock <= 0
                  ? 'Sin Stock'
                  : isAdding
                  ? 'Procesando...'
                  : 'Agregar al Carrito'}
              </button>

              <TrustAccordion
                shippingInfo={product.shipping_info}
                warrantyInfo={product.warranty_info}
                paymentInfo={product.payment_info}
              />

              <AccessoriesCarousel
                title="Completa tu equipo"
                showTopBorder={true}
                currentProductId={product.id}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarqueeBanner from './MarqueeBanner';
import HeroSection from './HeroSection';
import ProductCard from './ProductCard';
import MobileStickyCTA from './MobileStickyCTA';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
// <-- NUEVO: Importamos el carrusel de accesorios -->
import AccessoriesCarousel from '@/components/common/AccessoriesCarousel'; 

// Helper del carrito
import {
  readCart,
  upsertCartItem,
  incrementItem,
} from '@/lib/cart';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string; 
  price: number;
  originalPrice?: number;
  image: string;
  alt: string;
  features: string[];
  stockCount: number;
  badge?: string;
  is_outlet?: boolean; 
}

function normalizeFeatures(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {}
  }
  return [];
}

const HomepageInteractive = () => {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // --- ESTADOS PARA EL CONTADOR DE OFERTAS ---
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsHydrated(true);
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
    let mountedData = true;
    const loadProducts = async () => {
      setLoadingProducts(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('id,slug,name,model,description,price,original_price,image_url,stock_count,features,badge,is_active,is_outlet,created_at,show_on_home,packs')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!mountedData) return;
      if (error) {
        setLoadingProducts(false);
        return;
      }

      const allCards: Product[] = [];

      (data ?? []).forEach((p: any) => {
        if (p.show_on_home) {
          allCards.push({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description || '', 
            price: Number(p.price),
            originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
            image: p.image_url,
            alt: `${p.name} ${p.model ?? ''}`.trim(),
            features: normalizeFeatures(p.features),
            stockCount: Number(p.stock_count ?? 0),
            badge: p.badge ?? undefined,
            is_outlet: p.is_outlet ?? false,
          });
        }

        let loadedPacks: any[] = [];
        if (typeof p.packs === 'string') {
          try { loadedPacks = JSON.parse(p.packs); } catch (e) {}
        } else if (Array.isArray(p.packs)) {
          loadedPacks = p.packs;
        }

        loadedPacks.forEach((pack) => {
          if (pack.show_on_home) {
            allCards.push({
              id: `${p.id}-${pack.id}`, 
              slug: `${p.slug}?pack=${pack.id}`, 
              name: pack.name, 
              description: pack.tagline || p.description || '', 
              price: Number(pack.price),
              originalPrice: pack.original_price != null ? Number(pack.original_price) : undefined,
              image: (pack.images && pack.images.length > 0) ? pack.images[0] : p.image_url, 
              alt: `${p.name} ${pack.name}`,
              features: (pack.includes && pack.includes.length > 0) ? pack.includes : normalizeFeatures(p.features),
              stockCount: Number(pack.stock ?? 0), 
              badge: pack.badge || 'ENVÍO GRATIS', 
              is_outlet: false, 
            });
          }
        });
      });

      setProducts(allCards);
      setLoadingProducts(false);
    };

    loadProducts();
    return () => { mountedData = false; };
  }, [supabase]);

  const outletProducts = useMemo(() => 
    products.filter(p => p.is_outlet === true), 
  [products]);

  const regularPacks = useMemo(() => 
    products.filter(p => !p.is_outlet).slice(0, 4), 
  [products]);

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (Number.isFinite(p.stockCount) ? p.stockCount : 0), 0),
    [products]
  );

  const handleHeroCtaClick = () => {
    const packsSection = document.getElementById('packs-section');
    if (packsSection) packsSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddToCart = (productId: string) => {
    if (!isHydrated) return;
    const product = products.find((p) => p.id === productId);
    if (!product || product.stockCount <= 0) return;

    const m = String(product.id).match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-(.+)$/i);
    const isPack = Boolean(m);

    upsertCartItem({
      id: isPack ? `pack::${m![1]}::${m![2]}` : product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      alt: product.alt,
      stock: product.stockCount,
      ...(isPack
        ? {
            type: 'pack',
            parent_product_id: m![1],
            pack_id: m![2],
            price_preview: product.price,
          }
        : {
            type: 'product',
            product_id: product.id,
          }),
    } as any);
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="bg-[#F9F9F9] text-neutral-900 font-sans">
      
      {/* 1. HERO SECTION */}
      <HeroSection 
        onCtaClick={handleHeroCtaClick} 
        basicStock={0} 
        proStock={0} 
      />

      <main>
        {/* 2. SECCIÓN DE PACKS NORMALES */}
        <section id="packs-section" className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
              KITS LISTOS PARA GRABAR
            </h2>
            <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full"></div>
          </div>

          {loadingProducts ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
                <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-10 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-12 bg-gray-200 rounded-xl mt-6" />
                  </div>
                </div>
                <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-10 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-12 bg-gray-200 rounded-xl mt-6" />
                  </div>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {regularPacks.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={() => router.push(`/products/${product.slug}`)}
                  />
                ))}
            </div>
          )}
        </section>

        {/* 3. SECCIÓN OUTLET */}
        {outletProducts.length > 0 && outletProducts.map((outletProduct) => {
          const hasDiscount = outletProduct.originalPrice && outletProduct.originalPrice > outletProduct.price;
          
          return (
            <section key={`outlet-${outletProduct.id}`} className="pb-16 px-4 max-w-5xl mx-auto">
              <div className="bg-black rounded-3xl border border-red-900/30 p-10 md:p-16 text-center relative overflow-hidden shadow-2xl transform transition-transform hover:-translate-y-1 duration-500">
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>

                  <div className="relative z-10">
                      <span className={`inline-block px-4 py-1.5 text-[10px] font-black uppercase rounded-lg mb-6 tracking-widest shadow-md ${
                        (outletProduct.badge || '').toUpperCase() === 'ENVÍO GRATIS' 
                          ? 'bg-[#1ED760] text-black' 
                          : 'bg-white text-black'
                      }`}>
                        {outletProduct.badge || 'Últimas Unidades'}
                      </span>
                      
                      <h2 className="text-4xl md:text-6xl font-black text-red-600 uppercase tracking-tighter mb-4 drop-shadow-lg">
                        {outletProduct.name}
                      </h2>
                      
                      <p className="text-gray-300 text-sm md:text-base mb-8 max-w-lg mx-auto font-medium leading-relaxed">
                        {outletProduct.description || 'Kit de edición limitada.'}
                      </p>

                      {mounted && hasDiscount && (
                        <div className="flex justify-center mb-8">
                          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white bg-red-950/40 px-5 py-3 rounded-2xl border border-red-600/30 backdrop-blur-sm shadow-xl">
                            <div className="flex items-center gap-2">
                              <Icon name="ClockIcon" size={18} className="text-red-500 animate-pulse" />
                              <span className="uppercase tracking-widest text-red-100">La oferta termina en:</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black bg-red-600 px-2.5 py-1 rounded-lg shadow-sm min-w-[36px] text-center text-lg leading-none">
                                {String(timeLeft.hours).padStart(2, '0')}
                              </span>
                              <span className="text-red-500 font-black mb-1">:</span>
                              <span className="font-black bg-red-600 px-2.5 py-1 rounded-lg shadow-sm min-w-[36px] text-center text-lg leading-none">
                                {String(timeLeft.minutes).padStart(2, '0')}
                              </span>
                              <span className="text-red-500 font-black mb-1">:</span>
                              <span className="font-black bg-red-600 px-2.5 py-1 rounded-lg shadow-sm min-w-[36px] text-center text-lg leading-none">
                                {String(timeLeft.seconds).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-center items-baseline gap-4 mb-10">
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                          $U {outletProduct.price.toLocaleString('es-UY')}
                        </span>
                        {outletProduct.originalPrice && (
                          <span className="text-xl md:text-2xl font-bold text-gray-500 line-through decoration-red-600">
                            $U {outletProduct.originalPrice.toLocaleString('es-UY')}
                          </span>
                        )}
                      </div>
                      
                      <Link 
                        href={`/products/${outletProduct.slug}`} 
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm md:text-base rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_10px_30px_rgba(220,38,38,0.4)]"
                      >
                        ¡Aprovechar Liquidación!
                        <Icon name="ArrowRightIcon" size={18} />
                      </Link>
                  </div>
              </div>
            </section>
          );
        })}

        {/* --- NUEVO: 4. SECCIÓN ACCESORIOS (CARRUSEL ECOSISTEMA) --- */}
        <section className="pt-8 pb-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
              COMPLETÁ TU KIT
            </h2>
            <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          {/* Le pasamos title vacío para que no dibuje el título chiquito, pero sí el botón "Ver todos" */}
          <AccessoriesCarousel title="" showTopBorder={false} />
        </section>

        {/* CTA Flotante en Móviles */}
        <MobileStickyCTA onCtaClick={handleHeroCtaClick} totalStock={totalStock} />
      </main>
    </div>
  );
};

export default HomepageInteractive;
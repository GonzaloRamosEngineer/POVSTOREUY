'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
// ❌ HEADER Y FOOTER REMOVIDOS (Ahora están en layout.tsx)
import MarqueeBanner from './MarqueeBanner';
import HeroSection from './HeroSection';
import ProductCard from './ProductCard';
import MobileStickyCTA from './MobileStickyCTA';
import ComparisonTable from './ComparisonTable';
import TargetAudienceSection from './TargetAudienceSection';
import TestimonialsSection from './TestimonialsSection';
import NewsletterSection from './NewsletterSection';
import SocialMediaSection from './SocialMediaSection';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

// Helper del carrito
import {
  readCart,
  upsertCartItem,
  incrementItem,
  type CartItem as CartItemType,
} from '@/lib/cart';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt: string;
  features: string[];
  stockCount: number;
  badge?: string;
}

// Helpers locales
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

function pickProductByType(products: Product[], type: 'basic' | 'pro'): Product | undefined {
  const needles = type === 'basic' ? ['basico', 'básico', 'basic'] : ['pro', 'profesional'];
  const byName = products.find((p) => needles.some((n) => p.name?.toLowerCase().includes(n)));
  if (byName) return byName;
  if (products.length === 0) return undefined;
  if (type === 'pro') return [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
  return [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
}

const HomepageInteractive = () => {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // NOTA: Ya no necesitamos el estado 'cartItems' aquí para pasarlo al Header.
  // Solo lo necesitamos si quisiéramos validar stock vs carrito localmente, 
  // pero para simplificar, usaremos lectura directa.
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load products
  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError(null);

      const { data, error } = await supabase
        .from('products')
        .select('id,name,model,description,price,original_price,image_url,stock_count,features,badge,is_active,created_at')
        .eq('is_active', true)
        .eq('show_on_home', true)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error('Error loading products:', error);
        setProductsError(error.message || 'Error cargando productos.');
        setLoadingProducts(false);
        return;
      }

      const mapped: Product[] = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
        image: p.image_url,
        alt: `${p.name} ${p.model ?? ''}`.trim(),
        features: normalizeFeatures(p.features),
        stockCount: Number(p.stock_count ?? 0),
        badge: p.badge ?? undefined,
      }));

      setProducts(mapped);
      setLoadingProducts(false);
    };

    loadProducts();
    return () => { mounted = false; };
  }, [supabase]);

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (Number.isFinite(p.stockCount) ? p.stockCount : 0), 0),
    [products]
  );

  const basicProduct = useMemo(() => pickProductByType(products, 'basic'), [products]);
  const proProduct = useMemo(() => pickProductByType(products, 'pro'), [products]);
  const basicStock = basicProduct?.stockCount ?? 0;
  const proStock = proProduct?.stockCount ?? 0;

  // --- LÓGICA DE CARRITO MEJORADA ---
  const handleAddToCart = (productId: string) => {
    if (!isHydrated) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if ((product.stockCount ?? 0) <= 0) return; // Sin stock

    const currentCart = readCart();
    const existing = currentCart.find((i) => i.id === productId);

    if (existing) {
      incrementItem(productId, 1);
    } else {
      upsertCartItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        alt: product.alt,
        stock: product.stockCount,
      });
    }

    // 🔥 EL SECRETO: Avisar al Header Global que hubo cambios
    // Esto asegura que el numerito del carrito se actualice instantáneamente
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/products/${productId}`); // Corregí la ruta para que coincida con tu estructura Next.js
  };

  const handleHeroCtaClick = () => {
    const productsSection = document.getElementById('productos');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    // Ya no envolvemos en <body> o <html> porque eso está en layout.tsx
    // Usamos el fondo negro tech-noir
    <div className="bg-black text-neutral-200">
      
      {/* HEADER ELIMINADO: Ya está en layout.tsx */}

      <main>
        <MarqueeBanner />

        <HeroSection onCtaClick={handleHeroCtaClick} basicStock={basicStock} proStock={proStock} />

        <MobileStickyCTA onCtaClick={handleHeroCtaClick} totalStock={totalStock} />

        {/* Sección de Productos */}
        <section id="productos" className="py-24 px-4 bg-neutral-950 border-t border-red-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
                Nuestros Modelos
              </h2>
              <p className="text-lg text-neutral-400">
                Elegí la cámara perfecta para tu estilo de creación
              </p>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 h-[520px] animate-pulse" />
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 h-[520px] animate-pulse" />
              </div>
            ) : productsError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-8 text-center max-w-2xl mx-auto">
                <p className="text-red-400 font-bold">Error cargando productos.</p>
                <p className="text-sm mt-2">{productsError}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center max-w-2xl mx-auto">
                <p className="text-neutral-400">No hay productos activos por el momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <ComparisonTable />
        <TargetAudienceSection />
        <TestimonialsSection />
        <NewsletterSection />
        <SocialMediaSection />
        
        {/* FOOTER ELIMINADO: Ya está en layout.tsx */}
      </main>
    </div>
  );
};

export default HomepageInteractive;
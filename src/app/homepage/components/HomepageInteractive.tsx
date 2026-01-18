'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import MarqueeBanner from './MarqueeBanner';
import HeroSection from './HeroSection';
import ProductCard from './ProductCard';
import MobileStickyCTA from './MobileStickyCTA';
import ComparisonTable from './ComparisonTable';
import TargetAudienceSection from './TargetAudienceSection';
import TestimonialsSection from './TestimonialsSection';
import NewsletterSection from './NewsletterSection';
import SocialMediaSection from './SocialMediaSection';
import FooterSection from './FooterSection';
import { supabase } from '@/lib/supabaseClient';

// ✅ carrito unificado (helper)
import {
  readCart,
  upsertCartItem,
  incrementItem,
  type CartItem as CartItemType,
} from '@/lib/cart';

interface Product {
  id: string; // UUID
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt: string;
  features: string[];
  stockCount: number;
  badge?: string;
}

function normalizeFeatures(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      // ignore
    }
  }
  return [];
}

function pickProductByType(products: Product[], type: 'basic' | 'pro'): Product | undefined {
  const needles = type === 'basic' ? ['basico', 'básico', 'basic'] : ['pro', 'profesional'];

  const byName = products.find((p) => needles.some((n) => p.name?.toLowerCase().includes(n)));
  if (byName) return byName;

  if (products.length === 0) return undefined;

  if (type === 'pro') {
    return [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
  }
  return [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
}

const HomepageInteractive = () => {
  const router = useRouter();

  // avoid localStorage before hydration
  const [isHydrated, setIsHydrated] = useState(false);

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // cart
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);

  // 1) hydration + cart load
  useEffect(() => {
    setIsHydrated(true);
    setCartItems(readCart());
  }, []);

  // 2) load products
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError(null);

      const { data, error } = await supabase
        .from('products')
        .select(
          'id,name,model,description,price,original_price,image_url,stock_count,features,badge,is_active,created_at'
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setProductsError(error.message || 'Error cargando productos desde Supabase.');
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

    return () => {
      mounted = false;
    };
  }, []);

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (Number.isFinite(p.stockCount) ? p.stockCount : 0), 0),
    [products]
  );

  const basicProduct = useMemo(() => pickProductByType(products, 'basic'), [products]);
  const proProduct = useMemo(() => pickProductByType(products, 'pro'), [products]);

  const basicStock = basicProduct?.stockCount ?? 0;
  const proStock = proProduct?.stockCount ?? 0;

  const refreshCartState = () => {
    setCartItems(readCart());
  };

  const handleAddToCart = (productId: string) => {
    if (!isHydrated) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = cartItems.find((i) => i.id === productId);

    // opcional: si querés bloquear cuando no hay stock
    if ((product.stockCount ?? 0) <= 0) return;

    if (existing) {
      incrementItem(productId, 1);
      refreshCartState();
      return;
    }

    upsertCartItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      alt: product.alt,
      stock: product.stockCount,
    });

    refreshCartState();
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/product-details?id=${productId}`);
  };

  const handleHeroCtaClick = () => {
    const productsSection = document.getElementById('productos');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header cartItems={isHydrated ? cartItems : []} />

      <main>
        <MarqueeBanner />

        <HeroSection onCtaClick={handleHeroCtaClick} basicStock={basicStock} proStock={proStock} />

        <MobileStickyCTA onCtaClick={handleHeroCtaClick} totalStock={totalStock} />

        <section id="productos" className="py-16 px-4 bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                Nuestros Modelos
              </h2>
              <p className="text-lg text-muted-foreground">
                Elegí la cámara perfecta para tu estilo de creación
              </p>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-white/10 bg-white/5 h-[520px]" />
                <div className="rounded-2xl border border-white/10 bg-white/5 h-[520px]" />
              </div>
            ) : productsError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                <p className="text-red-200 font-medium">No se pudieron cargar los productos.</p>
                <p className="text-red-200/80 mt-2 text-sm">{productsError}</p>
                <p className="text-muted-foreground mt-4 text-sm">
                  Tip rápido: revisá que{' '}
                  <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span> sea el dominio real
                  de tu proyecto (no “xxxxx”) y reiniciá el dev server.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-muted-foreground">No hay productos activos para mostrar.</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Verificá en Supabase que existan productos con{' '}
                  <span className="font-medium">is_active = true</span>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <FooterSection />
      </main>
    </div>
  );
};

export default HomepageInteractive;

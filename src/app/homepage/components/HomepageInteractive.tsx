'use client';

import { useState, useEffect } from 'react';
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const HomepageInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setIsHydrated(true);
    const savedCart = localStorage.getItem('povstore_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const products: Product[] = [
  {
    id: 'pov-basico',
    name: 'POV Básico',
    price: 3990,
    originalPrice: 5990,
    image: "https://images.unsplash.com/photo-1589510881541-07f400e5f100",
    alt: 'Compact black POV mini camera with 4K recording capability on white background',
    features: [
    'Grabación 4K Ultra HD',
    'Batería 3 horas',
    'Peso 45g ultra ligero',
    'Resistencia IPX4',
    'Estabilización digital'],

    stockCount: 3,
    badge: 'MÁS VENDIDO'
  },
  {
    id: 'pov-pro',
    name: 'POV Pro',
    price: 5990,
    originalPrice: 8990,
    image: "https://images.unsplash.com/photo-1643110496205-b28072026c62",
    alt: 'Premium black POV Pro camera with advanced stabilization and extended battery on dark surface',
    features: [
    'Grabación 4K 60fps',
    'Batería 5 horas extendida',
    'Peso 50g',
    'Resistencia IPX6',
    'Estabilización avanzada',
    'Modo nocturno mejorado'],

    stockCount: 5,
    badge: 'PROFESIONAL'
  }];

  const totalStock = products.reduce((sum, p) => sum + p.stockCount, 0);

  const handleAddToCart = (productId: string) => {
    if (!isHydrated) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find((item) => item.id === productId);
    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [
      ...cartItems,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }];

    }

    setCartItems(updatedCart);
    localStorage.setItem('povstore_cart', JSON.stringify(updatedCart));
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/product-details?id=${productId}`);
  };

  const handleHeroCtaClick = () => {
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header cartItems={[]} />
        <main>
          <MarqueeBanner />
          <HeroSection onCtaClick={() => {}} basicStock={3} proStock={5} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {products.map((product) =>
                <ProductCard
                  key={product.id}
                  {...product}
                  onAddToCart={() => {}}
                  onViewDetails={() => {}} />

                )}
              </div>
            </div>
          </section>
          <ComparisonTable />
          <TargetAudienceSection />
          <TestimonialsSection />
          <NewsletterSection />
          <SocialMediaSection />
          <FooterSection />
        </main>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header cartItems={cartItems} />
      <main>
        <MarqueeBanner />
        <HeroSection 
          onCtaClick={handleHeroCtaClick} 
          basicStock={products[0].stockCount}
          proStock={products[1].stockCount}
        />
        <MobileStickyCTA 
          onCtaClick={handleHeroCtaClick}
          totalStock={totalStock}
        />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) =>
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails} />

              )}
            </div>
          </div>
        </section>

        <ComparisonTable />
        <TargetAudienceSection />
        <TestimonialsSection />
        <NewsletterSection />
        <SocialMediaSection />
        <FooterSection />
      </main>
    </div>);

};

export default HomepageInteractive;
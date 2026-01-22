'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import ProductSpecs from './ProductSpecs';
import AddToCartSection from './AddToCartSection';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { upsertCartItem, incrementItem, readCart } from '@/lib/cart';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
}

interface Specification {
  icon: string;
  label: string;
  value: string;
}

interface Review {
  id: string;
  author: string;
  authorImage: string;
  authorImageAlt: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface RelatedProduct {
  id: string;
  name: string;
  model: string;
  price: number;
  image: string;
  imageAlt: string;
  rating: number;
}

interface ProductRow {
  id: string; // uuid
  name: string;
  model: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_count: number | null;
  features: any;
  is_active?: boolean | null;
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

export default function ProductDetailsInteractive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id'); // <- UUID real

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [isHydrated, setIsHydrated] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductRow | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!productId) {
        setError('Falta el id del producto en la URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('id,name,model,description,price,original_price,image_url,stock_count,features,is_active')
        .eq('id', productId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setError(error.message || 'Error cargando producto');
        setProduct(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Producto no encontrado.');
        setProduct(null);
        setLoading(false);
        return;
      }

      // Si querés bloquear productos inactivos:
      if (data.is_active === false) {
        setError('Este producto no está disponible.');
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct({
        id: data.id,
        name: data.name,
        model: data.model ?? null,
        description: data.description ?? null,
        price: Number(data.price),
        original_price: data.original_price != null ? Number(data.original_price) : null,
        image_url: data.image_url ?? null,
        stock_count: data.stock_count != null ? Number(data.stock_count) : 0,
        features: data.features,
        is_active: data.is_active ?? true,
      });

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const title = useMemo(() => {
    if (!product) return '';
    return `${product.name}${product.model ? ` - ${product.model}` : ''}`;
  }, [product]);

  const desc = useMemo(() => {
    if (!product) return '';
    const f = normalizeFeatures(product.features);
    return product.description || (f.length ? f.join(' • ') : 'Producto POV Store Uruguay');
  }, [product]);

  const stockCount = product?.stock_count ?? 0;

  const stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' =
    stockCount <= 0 ? 'out-of-stock' : stockCount <= 5 ? 'low-stock' : 'in-stock';

  const galleryImages: GalleryImage[] = useMemo(() => {
    const url = product?.image_url || '';
    const alt = `${product?.name ?? 'Producto'} ${product?.model ?? ''}`.trim();
    if (!url) return [];
    return [{ id: 'main', url, alt, type: 'image' }];
  }, [product]);

  // Specs: por ahora fijo (cuando guardes specs en DB, lo mapeamos)
  const specifications: Specification[] = [
    { icon: 'VideoCameraIcon', label: 'Resolución de video', value: '4K a 30fps / 1080p a 60fps' },
    { icon: 'CameraIcon', label: 'Resolución de foto', value: '12 megapíxeles' },
    { icon: 'BoltIcon', label: 'Batería', value: '1200mAh - Hasta 90 minutos de grabación' },
    { icon: 'CircleStackIcon', label: 'Almacenamiento', value: 'MicroSD hasta 128GB (no incluida)' },
    { icon: 'WifiIcon', label: 'Conectividad', value: 'WiFi 2.4GHz + Bluetooth 5.0' },
    { icon: 'DevicePhoneMobileIcon', label: 'Dimensiones', value: '59 x 41 x 30 mm - Peso: 58g' },
    { icon: 'BeakerIcon', label: 'Resistencia', value: 'Resistente a salpicaduras IPX4' },
    { icon: 'CubeIcon', label: 'Accesorios incluidos', value: 'Cable USB-C, manual, soporte adhesivo' },
  ];

  // Reviews/Related: mock por ahora
  const reviews: Review[] = [
    {
      id: '1',
      author: 'Martín González',
      authorImage: 'https://images.unsplash.com/photo-1612993013894-3e0959edb6be',
      authorImageAlt: 'Hombre joven con barba corta y camisa azul sonriendo a la cámara',
      rating: 5,
      date: '15/12/2025',
      comment:
        'Excelente calidad de imagen para el precio. La uso para grabar mis videos y la calidad 4K es impresionante.',
      verified: true,
    },
  ];

  const relatedProducts: RelatedProduct[] = [];

  function ensureCartItemQuantity(productId: string, qty: number) {
    if (!product) return;

    const existing = readCart().find((i) => i.id === productId);

    if (existing) {
      // suma qty (no 1)
      incrementItem(productId, qty);
      return;
    }

    // crear con qty real
    upsertCartItem({
      id: product.id,
      name: title,
      model: product.model ?? undefined,
      price: Number(product.price),
      quantity: qty,
      image: product.image_url || '',
      alt: `${product.name} ${product.model ?? ''}`.trim(),
      stock: product.stock_count ?? 0,
    });
  }

  const handleAddToCart = (payload: { quantity: number }) => {
    if (!product) return;
    if (stockStatus === 'out-of-stock') return;

    const qty = Math.max(1, Math.min(10, payload.quantity || 1));
    ensureCartItemQuantity(product.id, qty);

    router.push('/shopping-cart');
  };

  const handleBuyNow = (payload: { quantity: number }) => {
    if (!product) return;
    if (stockStatus === 'out-of-stock') return;

    const qty = Math.max(1, Math.min(10, payload.quantity || 1));
    ensureCartItemQuantity(product.id, qty);

    // ✅ manda directo a checkout, pero primero guardó el carrito
    router.push('/checkout-payment');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-lg font-medium text-foreground">No se pudo cargar el producto</p>
          <p className="text-sm text-muted-foreground mt-2">{error ?? 'Error desconocido'}</p>
          <button
            onClick={() => router.push('/homepage')}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <ProductGallery images={galleryImages} productName={title} />
          </div>

          <div className="lg:col-span-4">
            <ProductInfo
              name={title}
              model={product.model ?? ''}
              price={Number(product.price)}
              originalPrice={product.original_price ?? undefined}
              rating={4.8}
              reviewCount={127}
              stockStatus={stockStatus}
              stockCount={stockCount}
              description={desc}
            />
          </div>

          <div className="lg:col-span-3">
            <AddToCartSection
              productId={product.id}
              productName={title}
              price={Number(product.price)}
              stockStatus={stockStatus}
              availableModels={[]}
              onAddToCart={({ quantity }) => handleAddToCart({ quantity })}
              onBuyNow={({ quantity }) => handleBuyNow({ quantity })}
            />
          </div>
        </div>

        <ProductSpecs specifications={specifications} />

        <CustomerReviews reviews={reviews} averageRating={4.8} totalReviews={127} />

        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}

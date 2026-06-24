    'use client';

    import { useEffect, useState, useMemo } from 'react';
    import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
    import AccessoryCard from './components/AccessoryCard'; 
    import { upsertCartItem } from '@/lib/cart';

    interface AccessoryProduct {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    alt: string;
    stockCount: number;
    badge?: string;
    rating?: number;
    features?: string[];
    }

    export default function AccessoriesStore() {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadAccessories = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('products')
            .select('id, slug, name, price, original_price, image_url, stock_count, badge, is_active, rating, features')
            .eq('is_active', true)
            .eq('is_accessory', true) 
            .order('created_at', { ascending: false });

        if (!mounted) return;
        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const mapped: AccessoryProduct[] = (data ?? []).map((p: any) => {
            const safeSlug = p.slug && p.slug.trim() !== '' ? p.slug : p.id;
            
            // --- FIX ANTI-0: Si en la base de datos es 0 o null, lo forzamos a 5.0 ---
            const safeRating = p.rating && p.rating > 0 ? Number(p.rating) : 5.0;

            return {
            id: p.id,
            slug: safeSlug,
            name: p.name,
            price: Number(p.price),
            originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
            image: p.image_url,
            alt: p.name,
            stockCount: Number(p.stock_count ?? 0),
            badge: p.badge ?? undefined,
            rating: safeRating,
            features: Array.isArray(p.features) ? (p.features as string[]) : [],
            };
        });

        setAccessories(mapped);
        setLoading(false);
        };

        loadAccessories();
        return () => { mounted = false; };
    }, [supabase]);

    const handleAddToCart = (productId: string) => {
        const product = accessories.find((p) => p.id === productId);
        if (!product || product.stockCount <= 0) return;
        
        upsertCartItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        alt: product.alt,
        stock: product.stockCount,
        });
        
        window.dispatchEvent(new Event('cart-updated'));
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] font-sans pb-24">
        
        {/* Encabezado */}
        <div className="relative overflow-hidden border-b border-gray-100 bg-white pt-32 pb-16 px-4">
            {/* Acento superior de marca */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            {/* Halo sutil */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-red-500/[0.04] blur-3xl" />

            <div className="relative max-w-6xl mx-auto text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-600 ring-1 ring-red-100">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Ecosistema POV
            </span>
            <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900">
                Accesorios Originales
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-500">
                Potenciá tu cámara con nuestro ecosistema de soportes, micrófonos y memorias de grado profesional.
            </p>
            </div>
        </div>

        {/* Grilla de Accesorios */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                <div className="h-96 bg-gray-200 rounded-3xl" />
                <div className="h-96 bg-gray-200 rounded-3xl" />
                <div className="h-96 bg-gray-200 rounded-3xl" />
            </div>
            ) : accessories.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium">
                Aún no hay accesorios publicados.
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {accessories.map((item) => (
                <AccessoryCard
                    key={item.id}
                    {...item}
                    onAddToCart={handleAddToCart}
                />
                ))}
            </div>
            )}
        </div>
        
        </div>
    );
    }
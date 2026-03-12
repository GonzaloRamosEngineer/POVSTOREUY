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
            .select('id, slug, name, price, original_price, image_url, stock_count, badge, is_active, rating')
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
            rating: safeRating 
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
        
        {/* Encabezado Simple */}
        <div className="bg-white border-b border-gray-100 pt-32 pb-16 px-4">
            <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                Accesorios Originales
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Potenciá tu cámara con nuestro ecosistema de soportes, lentes y estuches de grado profesional.
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
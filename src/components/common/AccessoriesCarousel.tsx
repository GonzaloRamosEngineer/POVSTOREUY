    'use client';

    import { useEffect, useState, useMemo } from 'react';
    import Link from 'next/link';
    import AppImage from '@/components/ui/AppImage';
    import Icon from '@/components/ui/AppIcon';
    import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
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
    }

    interface AccessoriesCarouselProps {
    title?: string;
    showTopBorder?: boolean;
    currentProductId?: string; // <-- NUEVO: Para saber qué producto ocultar
    }

    export default function AccessoriesCarousel({ 
    title = "Comprados frecuentemente juntos",
    showTopBorder = true,
    currentProductId
    }: AccessoriesCarouselProps) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchAccessories = async () => {
        // 1. Iniciamos la consulta a la base de datos
        let query = supabase
            .from('products')
            .select('id, slug, name, price, original_price, image_url, stock_count, is_active')
            .eq('is_active', true)
            .eq('is_accessory', true);

        // 2. NUEVO: Si recibimos un ID, le decimos a Supabase que NO lo incluya (.neq)
        if (currentProductId) {
            query = query.neq('id', currentProductId);
        }

        // 3. Ejecutamos la consulta final
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(8); 

        if (!mounted) return;
        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const mapped: AccessoryProduct[] = (data ?? []).map((p: any) => ({
            id: p.id,
            slug: p.slug && p.slug.trim() !== '' ? p.slug : p.id,
            name: p.name,
            price: Number(p.price),
            originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
            image: p.image_url,
            alt: p.name,
            stockCount: Number(p.stock_count ?? 0),
        }));

        setAccessories(mapped);
        setLoading(false);
        };

        fetchAccessories();
        return () => { mounted = false; };
    }, [supabase, currentProductId]);

    const handleAddToCart = (e: React.MouseEvent, product: AccessoryProduct) => {
        e.preventDefault(); 
        if (product.stockCount <= 0) return;
        
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

    // NUEVO: Si después de filtrar no queda nada, el carrusel desaparece por completo.
    if (loading || accessories.length === 0) return null;

    return (
        <div className={`w-full ${showTopBorder ? 'mt-10 border-t border-gray-200 pt-8' : 'mt-4'}`}>
        
        {/* Cabecera del Carrusel */}
        <div className="flex items-center justify-between mb-6 px-1">
            {title ? (
            <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Icon name="PlusCircleIcon" size={18} className="text-blue-600 hidden sm:block" />
                {title}
            </h3>
            ) : (
            <div /> 
            )}
            <Link href="/accessories" className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1">
            Ver todos <Icon name="ArrowRightIcon" size={12} />
            </Link>
        </div>
        
        {/* Contenedor scrolleable */}
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {accessories.map((acc) => {
            const hasDiscount = acc.originalPrice && acc.originalPrice > acc.price;
            const discountPercentage = hasDiscount 
                ? Math.round(((acc.originalPrice! - acc.price) / acc.originalPrice!) * 100)
                : 0;

            return (
                <Link 
                key={acc.id} 
                href={`/products/${acc.slug}`}
                className="flex-shrink-0 w-36 sm:w-44 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col snap-start hover:border-blue-200 hover:shadow-lg transition-all duration-300 group h-full"
                >
                {/* Foto Minimalista */}
                <div className="relative aspect-square w-full mb-3 bg-gray-50 rounded-xl overflow-hidden p-2">
                    <AppImage src={acc.image} alt={acc.alt} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                {/* Título */}
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug mb-1 line-clamp-2 flex-grow group-hover:text-blue-600 transition-colors">
                    {acc.name}
                </h4>
                
                {/* Precios y Botón */}
                <div className="flex items-end justify-between mt-auto gap-2 pt-2">
                    <div className="flex flex-col">
                    {hasDiscount && (
                        <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through tracking-tight whitespace-nowrap">
                            $U {acc.originalPrice!.toLocaleString('es-UY')}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                            {discountPercentage}% OFF
                        </span>
                        </div>
                    )}
                    <span className="font-black text-gray-900 text-sm sm:text-base leading-none">
                        $U {acc.price.toLocaleString('es-UY')}
                    </span>
                    </div>
                    
                    <button 
                    onClick={(e) => handleAddToCart(e, acc)}
                    disabled={acc.stockCount <= 0}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-900 rounded-full hover:bg-black hover:text-white transition-all active:scale-90 disabled:bg-gray-50 disabled:text-gray-300 disabled:hover:scale-100 flex-shrink-0"
                    aria-label="Agregar al carrito"
                    >
                    <Icon name="PlusIcon" size={14} />
                    </button>
                </div>
                </Link>
            );
            })}
        </div>

        <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
            display: none;
            }
        `}</style>
        </div>
    );
    }
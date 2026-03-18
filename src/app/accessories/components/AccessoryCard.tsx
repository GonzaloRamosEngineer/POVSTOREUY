    'use client';

    import { useState } from 'react';
    import Link from 'next/link'; 
    import AppImage from '@/components/ui/AppImage';
    import Icon from '@/components/ui/AppIcon';

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
    rating = 4.8, 
    badge,
    onAddToCart,
    }: AccessoryCardProps) {
    const isOutOfStock = stockCount <= 0;

    // Link para el botón "Notifícame"
    const whatsappUrl = `https://wa.me/59897801202?text=${encodeURIComponent(
        `Hola! Quiero que me avisen cuando ingrese stock del accesorio: ${name}`
    )}`;

    // --- FIX ANTI 404: Se asegura de que la URL siempre tenga un valor válido ---
    const productUrl = `/products/${slug || id}`;

    return (
        <div className="flex flex-col bg-white rounded-3xl p-6 transition-all duration-300 hover:shadow-lg border border-gray-50 h-full">
        {/* Insignia dinámica */}
        <div className="h-6 mb-4">
            {isOutOfStock ? (
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sin Stock</span>
            ) : badge ? (
            <span className={`text-xs font-bold uppercase tracking-widest ${
                badge.toUpperCase() === 'NUEVO' ? 'text-red-600' : 'text-blue-600'
            }`}>
                {badge}
            </span>
            ) : null}
        </div>

        {/* ENLACE AL PRODUCTO CON URL PROTEGIDA */}
        <Link href={productUrl} className="flex-grow flex flex-col group">
            {/* Imagen Minimalista */}
            <div className="relative aspect-square w-full mb-6">
            <AppImage
                src={image}
                alt={alt}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
            />
            </div>

            {/* Estrellas */}
            <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                <Icon
                    key={i}
                    name="StarIcon"
                    size={14}
                    variant={i < Math.floor(rating) ? 'solid' : 'outline'}
                    className={i >= Math.floor(rating) ? 'text-gray-300' : ''}
                />
                ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">{rating}</span>
            </div>

            {/* Título del accesorio */}
            <h3 className="text-xl font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
            {name}
            </h3>
            
            {/* Texto "Ver detalles" para incitar el clic */}
            <div className="mt-2 text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            Ver detalles <Icon name="ArrowRightIcon" size={12} />
            </div>
        </Link>

        {/* Precios y Botón */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-50">
            <div className="flex flex-col">
            {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-400 line-through mb-0.5">
                $U {originalPrice.toLocaleString('es-UY')}
                </span>
            )}
            <span className="text-lg font-bold text-gray-900">
                $U {price.toLocaleString('es-UY')}
            </span>
            </div>

            {isOutOfStock ? (
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-full hover:bg-gray-200 transition-colors text-center"
            >
                Notifícame
            </a>
            ) : (
            <button
                onClick={(e) => {
                e.preventDefault(); // Evita que al tocar el botón también se haga clic en el Link accidentalmente
                onAddToCart(id);
                }}
                className="px-6 py-2.5 bg-[#222222] text-white font-bold text-sm rounded-full hover:bg-black transition-all active:scale-95 shadow-md"
            >
                Añadir
            </button>
            )}
        </div>
        </div>
    );
    }
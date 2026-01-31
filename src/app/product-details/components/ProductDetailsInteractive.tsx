'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { upsertCartItem, incrementItem, readCart } from '@/lib/cart';

// --- Interfaces ---
interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
}

interface AddonProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface ProductData {
  id: string;
  name: string;
  model: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  stock_count: number;
  features: string[] | string; 
  is_active: boolean;
  // 👇 Actualizado para incluir stock por variante
  colors?: { name: string; hex: string; images?: string[]; stock?: number }[];
  addon_ids?: string[];
}

interface ProductInteractiveProps {
  productInitial: ProductData; 
  galleryInitial: GalleryImage[];
}

// --- Helpers ---
function normalizeFeatures(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  try {
      const parsed = JSON.parse(v as string);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch {}
  return [];
}

export default function ProductDetailsInteractive({ productInitial, galleryInitial }: ProductInteractiveProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const product = productInitial;

  // --- ESTADOS ---
  // Seleccionamos el primer color con stock preferiblemente, si no el primero disponible
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; images?: string[]; stock?: number } | null>(
      product.colors && product.colors.length > 0 ? product.colors[0] : null
  );

  const [addonsData, setAddonsData] = useState<AddonProduct[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // --- LÓGICA DE GALERÍA DINÁMICA ---
  const currentGallery = useMemo(() => {
    // Si hay variante seleccionada y tiene imágenes propias, usamos esas
    if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
        const videoItem = galleryInitial.find(i => i.type === 'video');
        const variantImages: GalleryImage[] = selectedColor.images.map((url, index) => ({
            id: `color-${selectedColor.name}-${index}`,
            url: url,
            alt: `${product.name} - ${selectedColor.name}`,
            type: 'image' as const
        }));
        return videoItem ? [videoItem, ...variantImages] : variantImages;
    }
    return galleryInitial;
  }, [selectedColor, galleryInitial, product.name]);

  // --- LÓGICA DE STOCK DINÁMICO ---
  // Si hay variante, usamos su stock. Si no, usamos el stock general.
  const currentStock = useMemo(() => {
      if (selectedColor && typeof selectedColor.stock === 'number') {
          return selectedColor.stock;
      }
      return product.stock_count;
  }, [selectedColor, product.stock_count]);

  const stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' =
    currentStock <= 0 ? 'out-of-stock' : currentStock <= 5 ? 'low-stock' : 'in-stock';

  // Reiniciar cantidad si cambia el stock disponible
  useEffect(() => {
      if (quantity > currentStock && currentStock > 0) setQuantity(currentStock);
      if (currentStock === 0) setQuantity(1); // Mantenemos 1 visualmente aunque esté deshabilitado
  }, [currentStock]);

  // --- EFECTOS ---
  useEffect(() => {
    const fetchAddons = async () => {
        if (!product.addon_ids?.length) return;
        const { data } = await supabase.from('products').select('id, name, price, image_url').in('id', product.addon_ids).eq('is_active', true);
        if (data) setAddonsData(data);
    };
    fetchAddons();
  }, [product.addon_ids, supabase]);

  // --- CÁLCULOS ---
  const title = useMemo(() => product.name + (product.model ? ` - ${product.model}` : ''), [product]);
  const desc = useMemo(() => {
      const f = normalizeFeatures(product.features);
      return product.description || (f.length ? f.join(' • ') : '');
  }, [product]);

  const totalPrice = useMemo(() => {
      const base = Number(product.price) * quantity;
      const addonsCost = selectedAddonIds.reduce((acc, id) => {
          const item = addonsData.find(a => a.id === id);
          return acc + (item ? Number(item.price) : 0);
      }, 0);
      return base + addonsCost;
  }, [product.price, quantity, selectedAddonIds, addonsData]);

  // --- HANDLERS ---
  const toggleAddon = (id: string) => {
      setSelectedAddonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddToCart = () => {
      if (stockStatus === 'out-of-stock') return;

      const mainProductName = selectedColor 
          ? `${product.name} (${selectedColor.name})` 
          : product.name;

      upsertCartItem({
          id: product.id, 
          name: mainProductName,
          model: product.model,
          price: Number(product.price),
          quantity: quantity,
          // Usamos la imagen que se está viendo actualmente (probablemente la de la variante)
          image: currentGallery[0]?.url || product.image_url,
          alt: title,
          stock: currentStock, // Guardamos el stock real de la variante
      });

      selectedAddonIds.forEach(addonId => {
          const item = addonsData.find(a => a.id === addonId);
          if (item) {
              const existing = readCart().find(c => c.id === item.id);
              if (existing) incrementItem(item.id, 1);
              else upsertCartItem({
                  id: item.id,
                  name: item.name,
                  model: 'Accesorio',
                  price: Number(item.price),
                  quantity: 1,
                  image: item.image_url,
                  stock: 99,
                  alt: item.name
              });
          }
      });

      // Disparar evento para actualizar header
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/shopping-cart');
  };

  if (product.is_active === false) return <div className="min-h-screen flex items-center justify-center text-gray-500">Producto no disponible.</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA 1: Galería */}
        <div className="lg:col-span-5">
          <ProductGallery images={currentGallery} productName={title} />
        </div>

        {/* COLUMNA 2: Info */}
        <div className="lg:col-span-4 space-y-6">
          <ProductInfo
            name={title}
            model={product.model ?? ''}
            price={Number(product.price)}
            originalPrice={product.original_price ?? undefined}
            rating={4.8}
            reviewCount={127}
            stockStatus={stockStatus}
            stockCount={currentStock} // Pasamos el stock de la variante
            description={desc}
          />

          {/* Selector de Colores */}
          {product.colors && product.colors.length > 0 && (
            <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                        Color: <span className="text-gray-500 font-normal">{selectedColor?.name}</span>
                    </h3>
                    {/* Feedback visual de stock por color */}
                    {selectedColor && (
                        <span className={`text-xs font-bold ${selectedColor.stock && selectedColor.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedColor.stock && selectedColor.stock > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                    )}
                </div>
                <div className="flex gap-3 flex-wrap">
                    {product.colors.map((c) => {
                        const isOutOfStock = (c.stock !== undefined && c.stock <= 0);
                        return (
                            <button
                                key={c.name}
                                onClick={() => setSelectedColor(c)}
                                disabled={false} // Permitimos seleccionar para ver, pero mostramos que no hay stock
                                className={`
                                    relative w-10 h-10 rounded-full border shadow-sm transition-all focus:outline-none
                                    ${selectedColor?.name === c.name ? 'ring-2 ring-offset-2 ring-blue-600 border-white scale-110' : 'border-gray-200 hover:scale-105'}
                                    ${isOutOfStock ? 'opacity-50 grayscale' : ''}
                                `}
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name} ${isOutOfStock ? '(Sin Stock)' : ''}`}
                            >
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-red-500 rotate-45 transform" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
          )}
        </div>

        {/* COLUMNA 3: Compra */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                  <div>
                      <p className="text-sm text-gray-500 mb-1">Precio Total</p>
                      <div className="text-3xl font-bold text-gray-900">${totalPrice.toLocaleString('es-UY')}</div>
                      {selectedAddonIds.length > 0 && <p className="text-xs text-green-600 mt-1 font-medium">Incluye {selectedAddonIds.length} accesorio(s)</p>}
                  </div>

                  {/* Addons List */}
                  {addonsData.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 border-b uppercase">Agrega Accesorios</div>
                        <div className="divide-y max-h-[220px] overflow-y-auto">
                            {addonsData.map(addon => (
                                <label key={addon.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer group">
                                    <input type="checkbox" checked={selectedAddonIds.includes(addon.id)} onChange={() => toggleAddon(addon.id)} className="w-4 h-4 text-blue-600 rounded" />
                                    <div className="w-10 h-10 border rounded bg-white p-0.5"><AppImage src={addon.image_url} alt={addon.name} className="object-contain" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{addon.name}</p>
                                        <p className="text-xs text-gray-500 font-mono">+${addon.price}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* Cantidad */}
                  <div className="flex items-center justify-between border rounded-md p-1">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-500 hover:text-blue-600" disabled={stockStatus === 'out-of-stock'}>
                          <Icon name="MinusIcon" size={16} />
                      </button>
                      <span className="font-bold text-gray-900 text-sm">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} className="p-2 text-gray-500 hover:text-blue-600" disabled={quantity >= currentStock || stockStatus === 'out-of-stock'}>
                          <Icon name="PlusIcon" size={16} />
                      </button>
                  </div>

                  {/* Botón Acción */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={stockStatus === 'out-of-stock'}
                    className={`w-full py-4 rounded-lg font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                        ${stockStatus === 'out-of-stock' 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-95'
                        }`}
                  >
                    <Icon name="ShoppingCartIcon" size={24} />
                    <span>{stockStatus === 'out-of-stock' ? 'Sin Stock' : 'Agregar al Carrito'}</span>
                  </button>
                  
                  {stockStatus === 'out-of-stock' && (
                      <p className="text-center text-xs text-red-500 font-medium">Variante agotada temporalmente.</p>
                  )}
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 px-2">
                 <Icon name="TruckIcon" size={20} className="text-green-600" />
                 <span>Despacho en 24 / 48 hs</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
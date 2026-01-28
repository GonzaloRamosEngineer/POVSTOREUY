'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
// ❌ BORRADO: ProductSpecs, CustomerReviews, RelatedProducts ya no se importan aquí
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

// Tipo para un Addon (Producto simplificado)
interface AddonProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

// Interfaz del Producto Principal
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
  colors?: { name: string; hex: string }[];
  addon_ids?: string[];
}

interface ProductInteractiveProps {
  productInitial: ProductData; 
  galleryInitial: GalleryImage[];
}

// --- Helpers ---
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

export default function ProductDetailsInteractive({ productInitial, galleryInitial }: ProductInteractiveProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  const product = productInitial;

  // --- ESTADOS ---
  const [selectedColor, setSelectedColor] = useState<string | null>(
      product.colors && product.colors.length > 0 ? product.colors[0].name : null
  );

  const [addonsData, setAddonsData] = useState<AddonProduct[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // --- EFECTOS ---
  useEffect(() => {
    const fetchAddons = async () => {
        if (!product.addon_ids || product.addon_ids.length === 0) return;
        
        const { data } = await supabase
            .from('products')
            .select('id, name, price, image_url')
            .in('id', product.addon_ids)
            .eq('is_active', true);
            
        if (data) setAddonsData(data);
    };
    fetchAddons();
  }, [product.addon_ids, supabase]);

  // --- CÁLCULOS DERIVADOS ---
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
      setSelectedAddonIds(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  const handleAddToCart = () => {
      if (stockStatus === 'out-of-stock') return;

      const mainProductName = selectedColor 
          ? `${product.name} (${selectedColor})` 
          : product.name;

      upsertCartItem({
          id: product.id, 
          name: mainProductName,
          model: product.model,
          price: Number(product.price),
          quantity: quantity,
          image: product.image_url,
          alt: title,
          stock: product.stock_count,
      });

      selectedAddonIds.forEach(addonId => {
          const item = addonsData.find(a => a.id === addonId);
          if (item) {
              const existing = readCart().find(c => c.id === item.id);
              if (existing) {
                  incrementItem(item.id, 1);
              } else {
                  upsertCartItem({
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
          }
      });

      router.push('/shopping-cart');
  };

  // Validación de seguridad
  if (product.is_active === false) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           <p className="text-gray-500">Este producto ya no está disponible.</p>
        </div>
     );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA 1: Galería */}
        <div className="lg:col-span-5">
          <ProductGallery images={galleryInitial} productName={title} />
        </div>

        {/* COLUMNA 2: Información Central */}
        <div className="lg:col-span-4 space-y-6">
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

          {/* Selector de Colores */}
          {product.colors && product.colors.length > 0 && (
            <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Color: <span className="text-gray-500 font-normal">{selectedColor}</span>
                </h3>
                <div className="flex gap-3">
                    {product.colors.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => setSelectedColor(c.name)}
                            className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 focus:outline-none ${selectedColor === c.name ? 'ring-2 ring-offset-2 ring-blue-600 border-white' : 'border-gray-200'}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                        />
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* COLUMNA 3: Acciones y Addons */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
              
              {/* Tarjeta de Compra */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                  {/* Precio Total */}
                  <div>
                      <p className="text-sm text-gray-500 mb-1">Precio Total</p>
                      <div className="text-3xl font-bold text-gray-900">
                          ${totalPrice.toLocaleString('es-UY')}
                      </div>
                      {selectedAddonIds.length > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                              Incluye {selectedAddonIds.length} accesorio(s)
                          </p>
                      )}
                  </div>

                  {/* Selector de Addons */}
                  {addonsData.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 border-b uppercase tracking-wide">
                            Agrega Accesorios
                        </div>
                        <div className="divide-y max-h-[220px] overflow-y-auto">
                            {addonsData.map(addon => (
                                <label key={addon.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedAddonIds.includes(addon.id)}
                                        onChange={() => toggleAddon(addon.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="w-10 h-10 relative border rounded bg-white flex-shrink-0 p-0.5">
                                        <AppImage src={addon.image_url} alt={addon.name} className="object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                            {addon.name}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono">
                                            +${addon.price}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* Selector de Cantidad */}
                  <div className="flex items-center justify-between border rounded-md p-1">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                          <Icon name="MinusIcon" size={16} />
                      </button>
                      <span className="font-bold text-gray-900 text-sm">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        disabled={quantity >= stockCount}
                      >
                          <Icon name="PlusIcon" size={16} />
                      </button>
                  </div>

                  {/* Botón Principal */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={stockStatus === 'out-of-stock'}
                    className={`w-full py-4 rounded-lg font-bold text-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2
                        ${stockStatus === 'out-of-stock' 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                        }`}
                  >
                    <Icon name="ShoppingCartIcon" size={24} />
                    <span>
                        {stockStatus === 'out-of-stock' ? 'Sin Stock' : 'Agregar al Carrito'}
                    </span>
                  </button>
                  
                  {stockStatus === 'out-of-stock' && (
                      <p className="text-center text-xs text-red-500 font-medium">
                          Lo sentimos, este producto está agotado temporalmente.
                      </p>
                  )}
              </div>

              {/* Info de Envío */}
              <div className="flex items-center gap-3 text-sm text-gray-600 px-2">
                 <Icon name="TruckIcon" size={20} className="text-green-600" />
                 <span>Envío gratis en compras mayores a $2000</span>
              </div>
          </div>
        </div>
      </div>

      {/* ❌ ZONA BORRADA: Aquí estaban ProductSpecs, Reviews y RelatedProducts.
          Ahora esto lo maneja page.tsx fuera de este componente. */}
    </div>
  );
}
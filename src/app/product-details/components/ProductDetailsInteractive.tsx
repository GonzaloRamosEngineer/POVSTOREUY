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
  model: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  stock_count: number;
  features: string[] | string;
  badge: string | null;
  gallery: string[];
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

// --- Componente Modal de Addon - VERSIÓN SIN SCROLL VISIBLE ---
function AddonDetailModal({ 
  addon, 
  isOpen, 
  onClose 
}: { 
  addon: AddonProduct; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const features = normalizeFeatures(addon.features);
  
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        {/* Modal Card - Sin Scroll Visible */}
        <div 
          className="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl my-auto shadow-2xl transform transition-all duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar absoluto */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Cerrar"
          >
            <Icon name="XMarkIcon" size={18} className="sm:w-5 sm:h-5 text-gray-700" />
          </button>

          {/* Layout Grid Responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            
            {/* COLUMNA IZQUIERDA - Imagen (2/5 del ancho en desktop) */}
            <div className="md:col-span-2 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl md:rounded-l-xl md:rounded-tr-none p-4 sm:p-6 flex items-center justify-center min-h-[280px] sm:min-h-[350px]">
              {/* Badge */}
              {addon.badge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
                    {addon.badge}
                  </span>
                </div>
              )}

              {/* Imagen Principal */}
              <div className="w-full aspect-square max-w-[200px] sm:max-w-[250px]">
                <AppImage 
                  src={addon.image_url} 
                  alt={addon.name}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>

              {/* Mini Gallery Thumbnails */}
              {addon.gallery && addon.gallery.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 sm:gap-2 justify-center">
                  {addon.gallery.slice(0, 3).map((img, idx) => (
                    <div key={idx} className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-md shadow-md overflow-hidden border border-gray-200">
                      <AppImage 
                        src={img} 
                        alt={`Vista ${idx + 1}`}
                        className="w-full h-full object-contain p-0.5 sm:p-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA - Info (3/5 del ancho en desktop) */}
            <div className="md:col-span-3 p-4 sm:p-6 space-y-3 sm:space-y-4">
              
              {/* Título */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight pr-8">
                  {addon.name}
                </h2>
                {addon.model && (
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{addon.model}</p>
                )}
              </div>

              {/* Precio y Stock */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ${Number(addon.price).toLocaleString('es-UY')}
                  </span>
                  {addon.original_price && addon.original_price > addon.price && (
                    <>
                      <span className="text-base sm:text-lg text-gray-400 line-through">
                        ${Number(addon.original_price).toLocaleString('es-UY')}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        {Math.round(((addon.original_price - addon.price) / addon.original_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                
                {/* Stock Badge */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    addon.stock_count > 5 ? 'bg-green-500' : 
                    addon.stock_count > 0 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className={`text-xs sm:text-sm font-semibold ${
                    addon.stock_count > 5 ? 'text-green-700' : 
                    addon.stock_count > 0 ? 'text-yellow-700' : 
                    'text-red-700'
                  }`}>
                    {addon.stock_count > 5 ? 'En Stock' : 
                     addon.stock_count > 0 ? `${addon.stock_count} unidades` : 
                     'Sin Stock'}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              {addon.description && (
                <div className="pb-3 border-b">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Descripción</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {addon.description}
                  </p>
                </div>
              )}

              {/* Features - TODAS VISIBLES */}
              {features.length > 0 && (
                <div className="pb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Características</h4>
                  <div className="space-y-1.5">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name="CheckIcon" size={10} className="text-green-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 flex-1 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS para scroll invisible en el overlay */}
      <style jsx global>{`
        body:has(.modal-open) {
          overflow: hidden;
        }
      `}</style>
    </>
  );
}

export default function ProductDetailsInteractive({ productInitial, galleryInitial }: ProductInteractiveProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const product = productInitial;

  // --- ESTADOS ---
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; images?: string[]; stock?: number } | null>(
      product.colors && product.colors.length > 0 ? product.colors[0] : null
  );

  const [addonsData, setAddonsData] = useState<AddonProduct[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [selectedAddonForModal, setSelectedAddonForModal] = useState<AddonProduct | null>(null);

  // --- LÓGICA DE GALERÍA DINÁMICA ---
  const currentGallery = useMemo(() => {
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
  const currentStock = useMemo(() => {
      if (selectedColor && typeof selectedColor.stock === 'number') {
          return selectedColor.stock;
      }
      return product.stock_count;
  }, [selectedColor, product.stock_count]);

  const stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' =
    currentStock <= 0 ? 'out-of-stock' : currentStock <= 5 ? 'low-stock' : 'in-stock';

  useEffect(() => {
      if (quantity > currentStock && currentStock > 0) setQuantity(currentStock);
      if (currentStock === 0) setQuantity(1);
  }, [currentStock, quantity]);

  // --- FETCH ADDONS CON TODOS LOS CAMPOS ---
  useEffect(() => {
    const fetchAddons = async () => {
        if (!product.addon_ids?.length) return;
        const { data } = await supabase
          .from('products')
          .select('id, name, model, description, price, original_price, image_url, stock_count, features, badge, gallery')
          .in('id', product.addon_ids)
          .eq('is_active', true);
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

  const openAddonModal = (addon: AddonProduct) => {
    setSelectedAddonForModal(addon);
    setAddonModalOpen(true);
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
          image: currentGallery[0]?.url || product.image_url,
          alt: title,
          stock: currentStock,
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
                  stock: item.stock_count,
                  alt: item.name
              });
          }
      });

      window.dispatchEvent(new Event('cart-updated'));
      router.push('/shopping-cart');
  };

  if (product.is_active === false) return <div className="min-h-screen flex items-center justify-center text-gray-500">Producto no disponible.</div>;

  return (
    <>
      {/* Modal */}
      {selectedAddonForModal && (
        <AddonDetailModal 
          addon={selectedAddonForModal}
          isOpen={addonModalOpen}
          onClose={() => setAddonModalOpen(false)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-8 sm:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          
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
              stockCount={currentStock}
              description={desc}
            />

            {/* Selector de Colores */}
            {product.colors && product.colors.length > 0 && (
              <div className="pt-3 sm:pt-4 border-t">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                          Color: <span className="text-gray-500 font-normal">{selectedColor?.name}</span>
                      </h3>
                      {selectedColor && (
                          <span className={`text-[10px] sm:text-xs font-bold ${selectedColor.stock && selectedColor.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {selectedColor.stock && selectedColor.stock > 0 ? 'Disponible' : 'Agotado'}
                          </span>
                      )}
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                      {product.colors.map((c) => {
                          const isOutOfStock = (c.stock !== undefined && c.stock <= 0);
                          return (
                              <button
                                  key={c.name}
                                  onClick={() => setSelectedColor(c)}
                                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border shadow-sm transition-all focus:outline-none ${selectedColor?.name === c.name ? 'ring-2 ring-offset-2 ring-blue-600 border-white scale-110' : 'border-gray-200 hover:scale-105'} ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                                  style={{ backgroundColor: c.hex }}
                                  title={`${c.name} ${isOutOfStock ? '(Sin Stock)' : ''}`}
                                  aria-label={`Seleccionar color ${c.name}`}
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
            <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm space-y-4 sm:space-y-6">
                    <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Precio Total</p>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                          ${totalPrice.toLocaleString('es-UY')}
                        </div>
                        {selectedAddonIds.length > 0 && (
                          <p className="text-[10px] sm:text-xs text-green-600 mt-1 font-medium">
                            Incluye {selectedAddonIds.length} accesorio(s)
                          </p>
                        )}
                    </div>

                    {/* Addons List - VERSIÓN PILL/BADGE */}
                    {addonsData.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 border-b uppercase">
                            Agrega Accesorios
                          </div>
                          <div className="divide-y max-h-[220px] sm:max-h-[280px] overflow-y-auto">
                              {addonsData.map(addon => {
                                const features = normalizeFeatures(addon.features);
                                const isSelected = selectedAddonIds.includes(addon.id);
                                const isOutOfStock = addon.stock_count === 0;
                                
                                return (
                                  <div 
                                    key={addon.id} 
                                    className={`relative ${isOutOfStock ? 'opacity-60' : ''}`}
                                  >
                                    {/* Item principal */}
                                    <label className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected} 
                                          onChange={() => toggleAddon(addon.id)} 
                                          disabled={isOutOfStock}
                                          className="w-4 h-4 text-blue-600 rounded disabled:cursor-not-allowed flex-shrink-0 mt-1" 
                                        />
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 border rounded bg-white p-0.5 sm:p-1 flex-shrink-0">
                                          <AppImage 
                                            src={addon.image_url} 
                                            alt={addon.name} 
                                            className="object-contain w-full h-full" 
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-[11px] sm:text-xs font-medium text-gray-900 line-clamp-2 pr-1">
                                              {addon.name}
                                            </p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <p className="text-[11px] sm:text-xs text-gray-500 font-mono">
                                                +${Number(addon.price).toLocaleString('es-UY')}
                                              </p>
                                              {addon.badge && (
                                                <span className="px-1 sm:px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] sm:text-[10px] font-bold rounded whitespace-nowrap">
                                                  {addon.badge}
                                                </span>
                                              )}
                                            </div>
                                            {/* Pill "Ver más" debajo del nombre */}
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                openAddonModal(addon);
                                              }}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 text-[10px] sm:text-xs font-semibold rounded-full transition-all duration-200 active:scale-95"
                                              title="Ver información completa"
                                            >
                                              <Icon name="EyeIcon" size={10} className="sm:w-3 sm:h-3" />
                                              <span>Ver más</span>
                                            </button>
                                            {isOutOfStock && (
                                              <p className="text-[9px] sm:text-[10px] text-red-500 font-medium">
                                                Sin stock
                                              </p>
                                            )}
                                        </div>
                                    </label>
                                  </div>
                                );
                              })}
                          </div>
                      </div>
                    )}

                    {/* Cantidad */}
                    <div className="flex items-center justify-between border rounded-md p-1">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-blue-600 active:bg-gray-100 rounded transition-colors" 
                          disabled={stockStatus === 'out-of-stock'}
                          aria-label="Disminuir cantidad"
                        >
                            <Icon name="MinusIcon" size={16} className="sm:w-5 sm:h-5" />
                        </button>
                        <span className="font-bold text-gray-900 text-sm sm:text-base min-w-[3ch] text-center">
                          {quantity}
                        </span>
                        <button 
                          onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} 
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-blue-600 active:bg-gray-100 rounded transition-colors" 
                          disabled={quantity >= currentStock || stockStatus === 'out-of-stock'}
                          aria-label="Aumentar cantidad"
                        >
                            <Icon name="PlusIcon" size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Botón Acción */}
                    <button 
                      onClick={handleAddToCart}
                      disabled={stockStatus === 'out-of-stock'}
                      className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-md transition-all flex items-center justify-center gap-2 ${stockStatus === 'out-of-stock' ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-95'}`}
                    >
                      <Icon name="ShoppingCartIcon" size={20} className="sm:w-6 sm:h-6" />
                      <span className="truncate">
                        {stockStatus === 'out-of-stock' ? 'Sin Stock' : 'Agregar al Carrito'}
                      </span>
                    </button>
                    
                    {stockStatus === 'out-of-stock' && (
                        <p className="text-center text-[10px] sm:text-xs text-red-500 font-medium">
                          Variante agotada temporalmente.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 px-2 justify-center lg:justify-start">
                   <Icon name="TruckIcon" size={18} className="text-green-600 sm:w-5 sm:h-5 flex-shrink-0" />
                   <span>Despacho en 24 / 48 hs</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
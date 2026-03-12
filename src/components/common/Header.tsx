'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { readCart, CartItem, clearCart } from '@/lib/cart';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'; // <-- IMPORTAMOS SUPABASE
// <-- NUEVO: Importamos los íconos súper livianos de lucide-react -->
import { Camera, Bike, Dog, Mountain, Package, Zap, Video } from 'lucide-react';

interface HeaderProps {
  isAdminMode?: boolean;
}

// Tipo para los kits dinámicos del menú
interface MenuKit {
    id: string;
    name: string;
    tagline: string;
    url: string;
    image: string;
}

// --- NUEVO: LÓGICA DE ÍCONOS INTELIGENTES ---
// Lee el nombre del kit y devuelve el ícono correspondiente automáticamente
const getSmartIcon = (name: string, className: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('moto')) return <Bike className={className} />;
  if (lower.includes('mascota') || lower.includes('perro') || lower.includes('gato')) return <Dog className={className} />;
  if (lower.includes('aventura') || lower.includes('viaje') || lower.includes('extremo')) return <Mountain className={className} />;
  if (lower.includes('creador') || lower.includes('pro') || lower.includes('vlog')) return <Zap className={className} />;
  return <Package className={className} />; // Ícono por defecto
};

const Header = ({ isAdminMode = false }: HeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  
  // --- NUEVOS ESTADOS PARA EL MENÚ DE KITS ---
  const [isKitsOpen, setIsKitsOpen] = useState(false);
  const [isMobileKitsOpen, setIsMobileKitsOpen] = useState(false);
  const [featuredKits, setFeaturedKits] = useState<MenuKit[]>([]);

  const [scrolled, setScrolled] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Cámaras fijas
  const products = [
    { 
      id: 'c98290bd-884f-49ce-9554-71a0210638f8', 
      slug: 'sjcam-c200', 
      name: 'SJCAM C200', 
      tagline: '4K & Estabilización',
      image: 'https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/products/1769698612746-gzjsukp0nyj.png'
    },
    { 
      id: '1aabfacb-5f35-4bcf-9e6d-0316483d8362', 
      slug: 'sjcam-c100plus', 
      name: 'SJCAM C100Plus', 
      tagline: 'Mini POV & Magnética',
      image: 'https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/products/1769699384843-528qlvmclfk.png'
    },
  ];

  const updateCartFromStorage = () => {
    const items = readCart();
    setCartItems(items);
  };

  useEffect(() => {
    setIsHydrated(true);
    updateCartFromStorage();
    const handleCartUpdate = () => updateCartFromStorage();
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('focus', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('focus', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen, isCartOpen]);

  // --- LÓGICA PARA CARGAR LOS KITS DESTACADOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchKits = async () => {
        const { data } = await supabase.from('products').select('id, slug, name, packs, image_url').eq('is_active', true);
        const kits: MenuKit[] = [];
        
        if (data) {
            data.forEach(p => {
                let loadedPacks: any[] = [];
                if (typeof p.packs === 'string') {
                    try { loadedPacks = JSON.parse(p.packs); } catch(e){}
                } else if (Array.isArray(p.packs)) {
                    loadedPacks = p.packs;
                }

                loadedPacks.forEach((pack: any) => {
                    if (pack.featured_in_menu) {
                        kits.push({
                            id: `${p.id}-${pack.id}`,
                            name: pack.name, // "Kit Motovlog"
                            tagline: pack.tagline || p.name, // "Para aventuras en moto"
                            url: `/products/${p.slug}?pack=${pack.id}`, // Enlace directo con el parámetro
                            image: (pack.images && pack.images.length > 0) ? pack.images[0] : p.image_url
                        });
                    }
                });
            });
        }
        setFeaturedKits(kits);
    };
    fetchKits();
  }, [supabase]);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que querés vaciar todo el carrito?')) {
      clearCart();
      setCartItems([]);
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsProductsOpen(false);
    setIsMobileProductsOpen(false);
    setIsKitsOpen(false);
    setIsMobileKitsOpen(false);
  };

  if (!isHydrated) return <header className="h-16 bg-black border-b border-white/5" />;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-black border-b border-white/5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            
            <Link href="/homepage" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={handleNavigate}>
              <div className="relative w-10 h-10">
                 <Image src="/icon.png" alt="POV Store Logo" width={40} height={40} className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight">POV Store</span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">Uruguay</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              
              {/* --- DROPDOWN DINÁMICO DE KITS --- */}
              <div 
                className="relative h-16 flex items-center"
                onMouseEnter={() => setIsKitsOpen(true)}
                onMouseLeave={() => setIsKitsOpen(false)}
              >
                <button className={`flex items-center gap-1 text-sm font-bold tracking-wide transition-all uppercase ${isKitsOpen ? 'text-red-500' : 'text-neutral-300 hover:text-white'}`}>
                  Kits
                  <Icon name="ChevronDownIcon" size={14} className={`transition-transform duration-300 ${isKitsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isKitsOpen && (
                  <div className="absolute top-full -left-4 pt-0 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-2">
                      <div className="p-2">
                        {featuredKits.length > 0 ? (
                            featuredKits.map((k) => (
                              <Link 
                                key={k.id} 
                                href={k.url} 
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                onClick={handleNavigate}
                              >
                                {/* ÍCONO INTELIGENTE REEMPLAZANDO A LA FOTO (DESKTOP KITS) */}
                                <div className="w-10 h-10 bg-neutral-800/50 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all duration-300">
                                    {getSmartIcon(k.name, "w-5 h-5")}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">{k.name}</div>
                                  <div className="text-[10px] text-neutral-500 uppercase font-bold">{k.tagline}</div>
                                </div>
                              </Link>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs font-medium text-neutral-500">
                                No hay kits destacados en este momento.
                            </div>
                        )}
                      </div>
                      
                      <div className="border-t border-white/10 p-1">
                          <Link href="/homepage#packs-section" className="block text-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest hover:text-white p-3 transition-colors" onClick={handleNavigate}>
                              Ver todos los Kits
                          </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className="relative h-16 flex items-center"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <button className={`flex items-center gap-1 text-sm font-bold tracking-wide transition-all uppercase ${isProductsOpen ? 'text-red-500' : 'text-neutral-300 hover:text-white'}`}>
                  Cámaras
                  <Icon name="ChevronDownIcon" size={14} className={`transition-transform duration-300 ${isProductsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProductsOpen && (
                  <div className="absolute top-full -left-4 pt-0 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-2">
                      <div className="p-2">
                        {products.map((p) => (
                          <Link 
                            key={p.id} 
                            href={`/products/${p.slug}`} 
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                            onClick={handleNavigate}
                          >
                            {/* ÍCONO VECTORIAL REEMPLAZANDO A LA FOTO (DESKTOP CÁMARAS) */}
                            <div className="w-10 h-10 bg-neutral-800/50 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all duration-300">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">{p.name}</div>
                              <div className="text-[10px] text-neutral-500 uppercase font-bold">{p.tagline}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/accessories" className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white uppercase transition-colors" onClick={handleNavigate}>
                Accesorios
              </Link>
              <Link href="/support" className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white uppercase transition-colors" onClick={handleNavigate}>
                Soporte
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-neutral-300 hover:text-white transition-colors group">
                <Icon name="ShoppingCartIcon" size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-black">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-neutral-300 hover:text-white">
                <Icon name="Bars3Icon" size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú Móvil */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-black md:hidden flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <span className="text-lg font-black text-white">Menú</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-400 hover:text-white">
              <Icon name="XMarkIcon" size={28} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-6 space-y-3">
            
            {/* --- KITS EN MÓVIL --- */}
            <div className="space-y-2">
              <button 
                onClick={() => setIsMobileKitsOpen(!isMobileKitsOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${isMobileKitsOpen ? 'bg-neutral-800' : 'bg-neutral-900'} text-white font-bold`}
              >
                <div className="flex items-center gap-4">
                  <Icon name="ArchiveBoxIcon" size={20} className={isMobileKitsOpen ? "text-red-500" : "text-neutral-400"} />
                  Kits Destacados
                </div>
                <Icon name="ChevronDownIcon" size={20} className={`transition-transform duration-300 ${isMobileKitsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileKitsOpen && (
                <div className="grid gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                  {featuredKits.map(k => (
                    <Link key={k.id} href={k.url} className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-900/50 border border-white/5 text-white group" onClick={handleNavigate}>
                      {/* ÍCONO INTELIGENTE REEMPLAZANDO A LA FOTO (MOBILE KITS) */}
                      <div className="w-10 h-10 bg-neutral-800/80 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400 group-hover:text-red-500 transition-colors">
                        {getSmartIcon(k.name, "w-5 h-5")}
                      </div>
                      <span className="font-bold text-sm group-hover:text-red-500 transition-colors">{k.name}</span>
                    </Link>
                  ))}
                  <Link href="/homepage#packs-section" className="p-3 text-center text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-widest transition-colors" onClick={handleNavigate}>
                      Ver todos
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${isMobileProductsOpen ? 'bg-neutral-800' : 'bg-neutral-900'} text-white font-bold`}
              >
                <div className="flex items-center gap-4">
                  <Icon name="VideoCameraIcon" size={20} className="text-neutral-400" />
                  Cámaras
                </div>
                <Icon name="ChevronDownIcon" size={20} className={`transition-transform duration-300 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileProductsOpen && (
                <div className="grid gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                  {products.map(p => (
                    <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-900/50 border border-white/5 text-white group" onClick={handleNavigate}>
                      {/* ÍCONO VECTORIAL REEMPLAZANDO A LA FOTO (MOBILE CÁMARAS) */}
                      <div className="w-10 h-10 bg-neutral-800/80 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400 group-hover:text-red-500 transition-colors">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm group-hover:text-red-500 transition-colors">{p.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/accessories" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold hover:text-red-500" onClick={handleNavigate}>
              <Icon name="PlusCircleIcon" size={20} className="text-neutral-400" /> Accesorios
            </Link>
            
            <Link href="/support" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold hover:text-red-500" onClick={handleNavigate}>
              <Icon name="LifebuoyIcon" size={20} className="text-neutral-400" /> Soporte
            </Link>

            {isAdminMode && (
              <Link href="/admin-dashboard" className="flex items-center gap-4 p-4 rounded-2xl bg-red-950/30 text-red-500 font-bold border border-red-900/50 mt-6" onClick={handleNavigate}>
                <Icon name="Cog6ToothIcon" size={20} /> Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute top-0 right-0 w-full sm:w-[400px] h-full bg-neutral-950 border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-black text-white uppercase">Tu Carrito</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-neutral-400 hover:text-white transition-colors">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center">
                    <Icon name="ShoppingCartIcon" size={32} className="text-neutral-600" />
                  </div>
                  <p className="text-neutral-400 font-medium">El carrito está vacío</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-red-500 font-bold hover:underline">Ver productos</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-neutral-900 rounded-xl border border-white/5 shadow-sm">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-black rounded-lg overflow-hidden p-1">
                        <AppImage src={item.image} alt={item.name} className="object-contain w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-neutral-400 font-medium">Cant: {item.quantity}</p>
                          <p className="text-sm font-black text-red-500">${(item.price * item.quantity).toLocaleString('es-UY')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-black space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-bold uppercase text-sm">Total Estimado</span>
                  <span className="text-2xl font-black text-white">${cartTotal.toLocaleString('es-UY')}</span>
                </div>
                
                <button onClick={handleClearCart} className="w-full py-2 bg-neutral-900 border border-white/10 text-neutral-400 font-bold text-center rounded-lg hover:bg-neutral-800 hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                  <Icon name="TrashIcon" size={14} /> Vaciar Carrito
                </button>

                <div className="grid gap-3">
                    <Link href="/shopping-cart" onClick={handleNavigate} className="w-full py-3 border-2 border-white/20 text-white font-black uppercase tracking-wider text-center rounded-xl hover:bg-white hover:text-black transition-all text-sm">
                        Ver Carrito
                    </Link>
                    <Link href="/checkout-payment" onClick={handleNavigate} className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-wider text-center rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 text-sm">
                        Finalizar Compra
                    </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { readCart, CartItem, clearCart } from '@/lib/cart';

interface HeaderProps {
  isAdminMode?: boolean;
}

const Header = ({ isAdminMode = false }: HeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false); // Dropdown desktop
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false); // Accordion mobile
  const [scrolled, setScrolled] = useState(false);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Datos de productos para el menú (IDs específicos)
  const products = [
    { 
      id: 'c98290bd-884f-49ce-9554-71a0210638f8', 
      name: 'SJCAM C200', 
      tagline: 'Pro 4K & Estabilización',
      image: 'https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/products/1769698612746-gzjsukp0nyj.png'
    },
    { 
      id: '1aabfacb-5f35-4bcf-9e6d-0316483d8362', 
      name: 'SJCAM C100Plus', 
      tagline: 'Mini POV & Magnética',
      image: 'https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/products/1769699384843-528qlvmclfk.png'
    },
  ];

  // Sincronización del carrito
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

  // Efecto de scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloqueo de scroll global
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen, isCartOpen]);

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
  };

  if (!isHydrated) return <header className="h-16 bg-neutral-950" />;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-neutral-950/95 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-neutral-950/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            
            {/* Logo */}
            <Link href="/homepage" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={handleNavigate}>
              <div className="relative w-10 h-10">
                 <Image src="/icon.png" alt="POV Store Logo" width={40} height={40} className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">POV Store</span>
                <span className="text-[10px] text-neutral-400 font-medium leading-none">Uruguay</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <div 
                className="relative h-16 flex items-center"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <button className={`flex items-center gap-1 text-sm font-bold tracking-wide transition-all uppercase ${isProductsOpen ? 'text-white' : 'text-neutral-300'}`}>
                  Productos
                  <Icon name="ChevronDownIcon" size={14} className={`transition-transform duration-300 ${isProductsOpen ? 'rotate-180 text-red-500' : ''}`} />
                </button>

                {/* Dropdown Panel */}
                {isProductsOpen && (
                  <div className="absolute top-full -left-4 pt-0 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl mt-2">
                      <div className="p-2">
                        {products.map((p) => (
                          <Link 
                            key={p.id} 
                            href={`/products/${p.id}`}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                            onClick={handleNavigate}
                          >
                            <div className="w-14 h-14 bg-black rounded-lg overflow-hidden border border-white/10 group-hover:border-red-500/50 transition-colors flex-shrink-0">
                              <AppImage src={p.image} alt={p.name} className="object-cover w-full h-full" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">{p.name}</div>
                              <div className="text-[10px] text-neutral-500 uppercase font-medium">{p.tagline}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link href="/homepage" className="block p-3 bg-neutral-800/50 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors border-t border-white/5">
                        Ver todo el catálogo
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/support" className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white uppercase" onClick={handleNavigate}>Soporte</Link>
              <Link href="/about" className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white uppercase" onClick={handleNavigate}>Nosotros</Link>
              <Link href="/contact" className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white uppercase" onClick={handleNavigate}>Contacto</Link>
            </nav>

            {/* Actions */}
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-neutral-950 md:hidden flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
            <span className="text-lg font-bold text-white">Menú</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-400">
              <Icon name="XMarkIcon" size={28} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            <div className="space-y-2">
              <button 
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${isMobileProductsOpen ? 'bg-neutral-800' : 'bg-neutral-900'} text-white font-bold`}
              >
                <div className="flex items-center gap-4">
                  <Icon name="ShoppingBagIcon" size={20} className="text-red-500" />
                  Productos
                </div>
                <Icon name="ChevronDownIcon" size={20} className={`transition-transform duration-300 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileProductsOpen && (
                <div className="grid gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                  {products.map(p => (
                    <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/50 text-white" onClick={handleNavigate}>
                      <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/5 flex-shrink-0">
                        <AppImage src={p.image} alt={p.name} />
                      </div>
                      <span className="font-semibold">{p.name}</span>
                    </Link>
                  ))}
                  <Link href="/homepage" className="p-4 text-center text-xs font-bold uppercase text-neutral-500" onClick={handleNavigate}>
                    Ver todo el catálogo
                  </Link>
                </div>
              )}
            </div>

            <Link href="/support" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold" onClick={handleNavigate}>
              <Icon name="LifebuoyIcon" size={20} className="text-neutral-400" /> Soporte
            </Link>
            <Link href="/about" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold" onClick={handleNavigate}>
              <Icon name="UserGroupIcon" size={20} className="text-neutral-400" /> Nosotros
            </Link>
            <Link href="/contact" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold" onClick={handleNavigate}>
              <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-neutral-400" /> Contacto
            </Link>

            {isAdminMode && (
              <Link href="/admin-dashboard" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 text-white font-bold border-t border-white/5 mt-4" onClick={handleNavigate}>
                <Icon name="Cog6ToothIcon" size={20} className="text-blue-500" /> Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute top-0 right-0 w-full sm:w-[400px] h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white">Tu Carrito</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-neutral-400 hover:text-white transition-colors">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
                    <Icon name="ShoppingCartIcon" size={32} className="text-neutral-500" />
                  </div>
                  <p className="text-neutral-400">El carrito está vacío</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-red-500 font-medium hover:underline">Ver productos</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-neutral-800/50 rounded-xl border border-neutral-800">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-black rounded-lg overflow-hidden">
                        <AppImage src={item.image} alt={item.name} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-neutral-400">Cant: {item.quantity}</p>
                          <p className="text-sm font-bold text-red-500">${(item.price * item.quantity).toLocaleString('es-UY')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-neutral-800 bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total Estimado</span>
                  <span className="text-xl font-bold text-white">${cartTotal.toLocaleString('es-UY')}</span>
                </div>
                
                <button onClick={handleClearCart} className="w-full py-2 bg-neutral-800 text-neutral-400 font-medium text-center rounded-lg hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
                  <Icon name="TrashIcon" size={16} /> Vaciar Carrito
                </button>

                <div className="grid gap-3">
                    <Link href="/shopping-cart" onClick={handleNavigate} className="w-full py-3 bg-white text-black font-bold text-center rounded-lg hover:bg-neutral-200 transition-colors">
                        Ver Carrito Completo
                    </Link>
                    <Link href="/checkout-payment" onClick={handleNavigate} className="w-full py-3 bg-red-600 text-white font-bold text-center rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
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
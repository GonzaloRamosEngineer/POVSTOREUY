'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { readCart, CartItem } from '@/lib/cart';

interface HeaderProps {
  isAdminMode?: boolean;
}

const Header = ({ isAdminMode = false }: HeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // ESTADO INTERNO DEL CARRITO
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Cargar carrito y Escuchar Cambios
  useEffect(() => {
    setIsHydrated(true);
    setCartItems(readCart());

    const handleCartUpdate = () => {
        setCartItems(readCart());
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Totales
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu/cart is open
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen, isCartOpen]);

  const handleCartToggle = () => setIsCartOpen(!isCartOpen);
  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  };

  if (!isHydrated) return <header className="h-16 bg-card" />;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-neutral-950/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            
            {/* Logo Section */}
            <Link
              href="/homepage"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={handleNavigate}
            >
              {/* NEW ICON IMPLEMENTATION */}
              <div className="relative w-10 h-10 flex-shrink-0">
                 <Image 
                    src="/icon.png" // Path to your icon in public folder
                    alt="POV Store Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority // Load this image immediately
                 />
              </div>
              
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none tracking-tight">POV Store</span>
                <span className="text-[10px] text-neutral-400 font-medium leading-none mt-0.5">Uruguay</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/homepage"
                className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white hover:scale-105 transition-all"
                onClick={handleNavigate}
              >
                MODELOS
              </Link>
              <Link
                href="/support"
                className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white hover:scale-105 transition-all"
                onClick={handleNavigate}
              >
                SOPORTE
              </Link>
              <Link
                href="/about"
                className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white hover:scale-105 transition-all"
                onClick={handleNavigate}
              >
                NOSOTROS
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <button
                onClick={handleCartToggle}
                className="relative p-2 text-neutral-300 hover:text-white transition-colors group"
                aria-label={`Shopping cart with ${cartItemCount} items`}
              >
                <Icon name="ShoppingCartIcon" size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-black">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={handleMobileMenuToggle}
                className="md:hidden p-2 text-neutral-300 hover:text-white"
                aria-label="Toggle menu"
              >
                <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black pt-20 px-6 md:hidden">
          <nav className="flex flex-col gap-6">
            <Link
              href="/homepage"
              className="text-2xl font-bold text-white"
              onClick={handleNavigate}
            >
              Modelos
            </Link>
            {isAdminMode && (
                 <Link href="/admin-dashboard" className="text-lg text-neutral-400">Admin</Link>
            )}
          </nav>
        </div>
      )}

      {/* Cart Drawer (Slide-over) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCartOpen(false)} 
          />
          
          {/* Drawer Panel */}
          <div className="absolute top-0 right-0 w-full sm:w-[400px] h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white">Tu Carrito</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {/* Drawer Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
                    <Icon name="ShoppingCartIcon" size={32} className="text-neutral-500" />
                  </div>
                  <p className="text-neutral-400">El carrito está vacío</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-red-500 font-medium hover:underline"
                  >
                    Ver productos
                  </button>
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

            {/* Drawer Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-neutral-800 bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total Estimado</span>
                  <span className="text-xl font-bold text-white">${cartTotal.toLocaleString('es-UY')}</span>
                </div>
                <div className="grid gap-3">
                    <Link
                        href="/shopping-cart"
                        onClick={handleNavigate}
                        className="w-full py-3 bg-white text-black font-bold text-center rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Ver Carrito Completo
                    </Link>
                    <Link
                        href="/checkout-payment"
                        onClick={handleNavigate}
                        className="w-full py-3 bg-red-600 text-white font-bold text-center rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                    >
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
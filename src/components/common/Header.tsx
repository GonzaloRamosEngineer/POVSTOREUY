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
  const [scrolled, setScrolled] = useState(false);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Función para actualizar el carrito desde localStorage
  const updateCartFromStorage = () => {
    const items = readCart();
    setCartItems(items);
  };

  // Cargar carrito y escuchar cambios
  useEffect(() => {
    setIsHydrated(true);
    updateCartFromStorage();

    const handleCartUpdate = () => {
      updateCartFromStorage();
    };

    // Escuchar eventos personalizados y cambios en localStorage
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    // También actualizar cuando la ventana recupera el foco
    window.addEventListener('focus', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('focus', handleCartUpdate);
    };
  }, []);

  // Actualizar carrito cuando se abre el drawer
  useEffect(() => {
    if (isCartOpen) {
      updateCartFromStorage();
    }
  }, [isCartOpen]);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Función para vaciar el carrito
  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que querés vaciar todo el carrito?')) {
      clearCart();
      setCartItems([]);
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('storage'));
    }
  };

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

  // Links de navegación centralizados
  const navLinks = [
    { href: '/homepage', label: 'Productos', icon: 'ShoppingBagIcon' },
    { href: '/support', label: 'Soporte', icon: 'LifebuoyIcon' },
    { href: '/about', label: 'Nosotros', icon: 'UserGroupIcon' },
    { href: '/contact', label: 'Contacto', icon: 'ChatBubbleLeftRightIcon' },
  ];

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
            
            {/* Logo Section */}
            <Link
              href="/homepage"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={handleNavigate}
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                 <Image 
                    src="/icon.png"
                    alt="POV Store Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                 />
              </div>
              
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none tracking-tight">POV Store</span>
                <span className="text-[10px] text-neutral-400 font-medium leading-none mt-0.5">Uruguay</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-bold tracking-wide text-neutral-300 hover:text-white hover:scale-105 transition-all uppercase"
                  onClick={handleNavigate}
                >
                  {link.label}
                </Link>
              ))}
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
        <div className="fixed inset-0 z-[90] bg-neutral-950 md:hidden">
          {/* Backdrop con patrón sutil */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative h-full pt-20 px-6 flex flex-col">
            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col gap-2 py-6">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl text-white hover:bg-neutral-900 transition-all group"
                  onClick={handleNavigate}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'slideIn 0.3s ease-out forwards'
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                    <Icon name={link.icon as any} size={20} className="text-neutral-400 group-hover:text-white" />
                  </div>
                  <span className="text-lg font-semibold">{link.label}</span>
                  <Icon name="ChevronRightIcon" size={20} className="ml-auto text-neutral-600 group-hover:text-white transition-colors" />
                </Link>
              ))}
              
              {/* Admin link si aplica */}
              {isAdminMode && (
                <Link 
                  href="/admin-dashboard" 
                  className="flex items-center gap-4 px-4 py-4 rounded-xl text-white hover:bg-neutral-900 transition-all group mt-4 border-t border-neutral-800 pt-6"
                  onClick={handleNavigate}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Icon name="Cog6ToothIcon" size={20} className="text-neutral-400 group-hover:text-white" />
                  </div>
                  <span className="text-lg font-semibold">Admin Dashboard</span>
                </Link>
              )}
            </nav>

            {/* Footer con info adicional */}
            <div className="border-t border-neutral-800 py-6 space-y-4">
              <div className="flex items-center justify-center gap-6 text-sm text-neutral-500">
                <a href="https://www.instagram.com/povstore.uy/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <Icon name="CameraIcon" size={20} />
                </a>
                <a href="https://www.tiktok.com/@povstore.uy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <Icon name="MusicalNoteIcon" size={20} />
                </a>
              </div>
              <p className="text-center text-xs text-neutral-600">
                POV Store Uruguay © 2026
              </p>
            </div>
          </div>
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
                
                {/* Botón para vaciar carrito */}
                <button
                  onClick={handleClearCart}
                  className="w-full py-2 bg-neutral-800 text-neutral-400 font-medium text-center rounded-lg hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Icon name="TrashIcon" size={16} />
                  Vaciar Carrito
                </button>

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

      {/* Animación para el mobile menu */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Header;
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface HeaderProps {
  cartItems?: CartItem[];
  onCartClick?: () => void;
  isAdminMode?: boolean;
}

const Header = ({ cartItems = [], onCartClick, isAdminMode = false }: HeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isCartOpen]);

  const handleCartToggle = () => {
    setIsCartOpen(!isCartOpen);
    if (onCartClick && !isCartOpen) onCartClick();
  };

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-smooth ${
          scrolled ? 'bg-card shadow-lg' : 'bg-card shadow-md'
        }`}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Logo */}
            <Link
              href="/homepage"
              className="flex items-center gap-3 transition-smooth hover:opacity-80 focus-ring rounded-md"
              onClick={handleNavigate}
            >
              <div className="relative w-10 h-10 flex items-center justify-center bg-primary rounded-lg">
                <Icon name="VideoCameraIcon" size={24} className="text-primary-foreground" variant="solid" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-heading font-semibold text-foreground leading-tight">POV Store</span>
                <span className="text-xs font-caption text-muted-foreground leading-tight">Uruguay</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/homepage"
                className="text-sm font-medium text-foreground hover:text-primary transition-smooth focus-ring rounded-md px-3 py-2"
                onClick={handleNavigate}
              >
                Modelos
              </Link>

              {/* Si querés, podés agregar más links públicos acá */}
              {/* <Link href="/faq" ...>FAQ</Link> */}
            </nav>

            {/* Cart + Mobile */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <button
                onClick={handleCartToggle}
                className="relative flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-smooth focus-ring"
                aria-label={`Shopping cart with ${cartItemCount} items`}
              >
                <Icon name="ShoppingCartIcon" size={20} className="text-foreground" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-primary-foreground bg-primary rounded-full">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-medium text-foreground">Cart</span>
              </button>

              {/* Mobile Menu */}
              <button
                onClick={handleMobileMenuToggle}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted transition-smooth focus-ring"
                aria-label="Toggle mobile menu"
              >
                <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} className="text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden" style={{ top: '64px' }}>
          <nav className="flex flex-col p-6 gap-4">
            <Link
              href="/homepage"
              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted rounded-md transition-smooth"
              onClick={handleNavigate}
            >
              <Icon name="HomeIcon" size={20} className="text-primary" />
              Products
            </Link>

            {/* En admin mode no mostramos admin link acá tampoco */}
            {!isAdminMode ? null : null}
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40" style={{ top: '64px' }}>
          <div className="absolute inset-0 bg-background" onClick={() => setIsCartOpen(false)} />
          <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-card shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">Shopping Cart</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-smooth focus-ring"
                aria-label="Close cart"
              >
                <Icon name="XMarkIcon" size={20} className="text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon name="ShoppingCartIcon" size={48} className="text-muted-foreground mb-4" />
                  <p className="text-base text-muted-foreground mb-2">Your cart is empty</p>
                  <Link
                    href="/homepage"
                    className="text-sm text-primary hover:text-primary/80 transition-smooth"
                    onClick={handleNavigate}
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-muted rounded-md">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-background rounded-md overflow-hidden">
                        <AppImage src={item.image} alt={item.name} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                        <p className="text-sm font-mono font-medium text-primary mt-1">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-foreground">Total</span>
                  <span className="text-lg font-mono font-semibold text-primary">${cartTotal.toFixed(2)}</span>
                </div>

                <Link
                  href="/shopping-cart"
                  className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-center font-medium rounded-md transition-smooth focus-ring"
                  onClick={handleNavigate}
                >
                  View Cart
                </Link>

                <Link
                  href="/checkout-payment"
                  className="block w-full px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground text-center font-medium rounded-md transition-smooth focus-ring"
                  onClick={handleNavigate}
                >
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-16" />
    </>
  );
};

export default Header;

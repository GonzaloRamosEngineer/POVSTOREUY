'use client';

import { useState, useEffect } from 'react';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';
import EmptyCart from './EmptyCart';
import PolicySection from './PolicySection';
import StockAlert from './StockAlert';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
  stock: number;
}

const mockCartData: CartProduct[] = [
{
  id: '1',
  name: 'Cámara POV 4K Básico',
  price: 3500,
  quantity: 1,
  image: "https://images.unsplash.com/photo-1701120285912-889e5e4210ba",
  alt: 'Cámara POV 4K compacta negra con lente gran angular sobre fondo blanco',
  stock: 3
},
{
  id: '2',
  name: 'Cámara POV 4K Pro',
  price: 5200,
  quantity: 2,
  image: "https://images.unsplash.com/photo-1614699582062-2c42cecdc792",
  alt: 'Cámara POV 4K profesional plateada con pantalla táctil y accesorios incluidos',
  stock: 8
}];


export default function ShoppingCartInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartItems, setCartItems] = useState<CartProduct[]>(mockCartData);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-40 bg-muted rounded" />
                <div className="h-40 bg-muted rounded" />
              </div>
              <div className="h-96 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>);

  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setCartItems((prevItems) =>
    prevItems.map((item) =>
    item.id === id ? { ...item, quantity: newQuantity } : item
    )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 250;
  const total = subtotal + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowestStock = Math.min(...cartItems.map((item) => item.stock));

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <EmptyCart />
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
            Carrito de Compras
          </h1>
          <p className="text-base text-muted-foreground">
            Revisa tus productos antes de proceder al pago
          </p>
        </div>

        {/* Stock Alert */}
        {lowestStock <= 5 &&
        <div className="mb-6">
            <StockAlert stock={lowestStock} />
          </div>
        }

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) =>
            <CartItem
              key={item.id}
              {...item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem} />

            )}

            {/* Policy Section - Mobile */}
            <div className="lg:hidden mt-8">
              <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                Información Importante
              </h2>
              <PolicySection />
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              itemCount={itemCount} />

          </div>
        </div>

        {/* Policy Section - Desktop */}
        <div className="hidden lg:block mt-12">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
            Información Importante
          </h2>
          <PolicySection />
        </div>
      </div>
    </div>);

}
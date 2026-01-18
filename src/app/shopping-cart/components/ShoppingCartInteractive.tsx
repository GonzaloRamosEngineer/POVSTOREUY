'use client';

import { useEffect, useMemo, useState } from 'react';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';
import EmptyCart from './EmptyCart';
import PolicySection from './PolicySection';
import StockAlert from './StockAlert';
import { readCart, updateQty, removeItem, type CartItem as CartItemType } from '@/lib/cart';

type CartProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
  stock: number;
};

function toCartProduct(i: CartItemType): CartProduct {
  return {
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image,
    alt: i.alt,
    stock: i.stock ?? 99, // si no viene stock en carrito, no bloquees
  };
}

export default function ShoppingCartInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);

  useEffect(() => {
    setIsHydrated(true);
    setCartItems(readCart().map(toCartProduct));
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const shipping = useMemo(() => (subtotal >= 2000 ? 0 : 250), [subtotal]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const lowestStock = useMemo(
    () => (cartItems.length ? Math.min(...cartItems.map((i) => i.stock)) : 99),
    [cartItems]
  );

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
      </div>
    );
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    // 1) estado UI
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: newQuantity } : it))
    );

    // 2) storage
    updateQty(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    // 1) estado UI
    setCartItems((prev) => prev.filter((it) => it.id !== id));

    // 2) storage
    removeItem(id);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <EmptyCart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
            Carrito de Compras
          </h1>
          <p className="text-base text-muted-foreground">
            Revisa tus productos antes de proceder al pago
          </p>
        </div>

        {lowestStock <= 5 && (
          <div className="mb-6">
            <StockAlert stock={lowestStock} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                {...item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
              />
            ))}

            <div className="lg:hidden mt-8">
              <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                Información Importante
              </h2>
              <PolicySection />
            </div>
          </div>

          <div>
            <OrderSummary
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              itemCount={itemCount}
            />
          </div>
        </div>

        <div className="hidden lg:block mt-12">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
            Información Importante
          </h2>
          <PolicySection />
        </div>
      </div>
    </div>
  );
}

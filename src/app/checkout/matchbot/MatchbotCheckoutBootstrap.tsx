'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { writeCart, type CartItem } from '@/lib/cart';

export default function MatchbotCheckoutBootstrap({ item }: { item: CartItem }) {
  const router = useRouter();

  useEffect(() => {
    // Un enlace de compra de MatchBot representa una selección explícita. Reemplazamos el carrito
    // para que un artículo viejo del navegador no se agregue silenciosamente a esta compra.
    writeCart([item]);
    window.dispatchEvent(new Event('cart-updated'));
    window.sessionStorage.setItem('povstore_checkout_source', 'matchbot');
    router.replace('/checkout-payment?source=matchbot');
  }, [item, router]);

  return (
    <main className="min-h-[70vh] bg-background px-6 py-20 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <h1 className="text-xl font-bold text-foreground">Preparando tu compra</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos cargando el producto recomendado y verificando su disponibilidad.
        </p>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export default function OrderSummary({
  subtotal,
  shipping,
  total,
  itemCount
}: OrderSummaryProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6 sticky top-20">
      <h2 className="text-xl font-heading font-semibold text-foreground">
        Resumen del Pedido
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
          </span>
          <span className="text-base font-mono font-medium text-foreground">
            ${subtotal.toLocaleString('es-UY')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Envío</span>
          <span className="text-base font-mono font-medium text-foreground">
            {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-UY')}`}
          </span>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-foreground">Total</span>
            <span className="text-2xl font-mono font-bold text-primary">
              ${total.toLocaleString('es-UY')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/checkout-payment"
          className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-semibold rounded-md transition-smooth focus-ring"
        >
          <Icon name="ShoppingBagIcon" size={20} className="text-primary-foreground" variant="solid" />
          Proceder al Pago
        </Link>

        <Link
          href="/homepage"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-md transition-smooth focus-ring"
        >
          <Icon name="ArrowLeftIcon" size={20} className="text-foreground" />
          Seguir Comprando
        </Link>
      </div>

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-start gap-3">
          <Icon name="TruckIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Envío Gratis</p>
            <p className="text-xs text-muted-foreground mt-1">
              A todo Uruguay en compras superiores a $2.000
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="ShieldCheckIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Compra Segura</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pago protegido con MercadoPago
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="UserIcon" size={20} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Sin Registro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Compra como invitado sin crear cuenta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
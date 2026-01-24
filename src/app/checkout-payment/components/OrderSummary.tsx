'use client';

import Icon from '@/components/ui/AppIcon';

type DeliveryMethod = 'delivery' | 'pickup';

interface OrderItem {
  id: string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  deliveryMethod: DeliveryMethod;
  pickupAddress: string;
}

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  isExpanded,
  onToggle,
  deliveryMethod,
  pickupAddress,
}: OrderSummaryProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Resumen del Pedido
        </h2>

        <button
          type="button"
          onClick={onToggle}
          className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
        >
          {isExpanded ? 'Ocultar' : 'Ver detalle'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.alt} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {it.name}{it.model ? ` - ${it.model}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {it.quantity} x ${it.price.toLocaleString('es-UY')}
                </p>
              </div>
              <div className="text-sm font-mono text-foreground">
                ${(it.price * it.quantity).toLocaleString('es-UY')}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-mono text-foreground">
            ${subtotal.toLocaleString('es-UY')}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="text-sm text-muted-foreground">Envío</span>
          <div className="text-right">
            <span className="text-sm font-mono text-foreground">
              {deliveryMethod === 'pickup'
                ? 'Retiro (Gratis)'
                : shipping === 0
                  ? 'Gratis'
                  : `$${shipping.toLocaleString('es-UY')}`}
            </span>

            {deliveryMethod === 'pickup' && (
              <div className="mt-1 text-xs text-muted-foreground flex items-start justify-end gap-2">
                <Icon name="MapPinIcon" size={14} className="text-muted-foreground mt-0.5" />
                <span className="max-w-[260px]">{pickupAddress}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-foreground">Total</span>
            <span className="text-2xl font-mono font-bold text-primary">
              ${total.toLocaleString('es-UY')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

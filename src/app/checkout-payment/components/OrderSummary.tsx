import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

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
}

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  isExpanded,
  onToggle
}: OrderSummaryProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Mobile Header */}
      <button
        onClick={onToggle}
        className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-muted transition-smooth"
        aria-label="Toggle order summary"
      >
        <div className="flex items-center gap-3">
          <Icon name="ShoppingBagIcon" size={20} className="text-primary" />
          <span className="text-base font-medium text-foreground">
            Resumen del Pedido
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono font-semibold text-primary">
            ${total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <Icon
            name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
            size={20}
            className="text-muted-foreground"
          />
        </div>
      </button>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center gap-3 p-6 border-b border-border">
        <Icon name="ShoppingBagIcon" size={24} className="text-primary" />
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Resumen del Pedido
        </h2>
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block`}>
        {/* Items List */}
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-background rounded-md overflow-hidden">
                <AppImage
                  src={item.image}
                  alt={item.alt}
                  className="object-cover w-full h-full"
                />
                <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {item.quantity}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.model}
                </p>
                <p className="text-sm font-mono font-medium text-primary mt-2">
                  ${(item.price * item.quantity).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="p-6 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm font-mono text-foreground">
              ${subtotal.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Envío</span>
            <span className="text-sm font-mono text-foreground">
              {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-base font-medium text-foreground">Total</span>
            <span className="text-xl font-mono font-semibold text-primary">
              ${total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="p-6 bg-muted border-t border-border">
          <div className="flex items-start gap-3">
            <Icon name="ShieldCheckIcon" size={20} className="text-success flex-shrink-0 mt-0.5" variant="solid" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Compra Segura
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tus datos están protegidos con encriptación SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
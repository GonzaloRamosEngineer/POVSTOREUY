import React from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface OrderItem {
  id: string;
  name: string;
  model: string;
  quantity: number;
  price: number;
  image: string;
  alt: string;
}

interface OrderSummaryCardProps {
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  total,
  paymentMethod,
}) => {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
            Resumen del Pedido
          </h2>
          <p className="text-sm text-muted-foreground">
            Pedido #{orderNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Fecha</p>
          <p className="text-sm font-medium text-foreground">{orderDate}</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
              <AppImage
                src={item.image}
                alt={item.alt}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-foreground truncate">
                {item.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{item.model}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">
                  Cantidad: {item.quantity}
                </span>
                <span className="text-base font-mono font-semibold text-primary">
                  ${item.price.toLocaleString('es-UY')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono text-foreground">
            ${subtotal.toLocaleString('es-UY')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span className="font-mono text-foreground">
            ${shipping.toLocaleString('es-UY')}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-lg font-heading font-semibold text-foreground">
            Total
          </span>
          <span className="text-2xl font-mono font-bold text-primary">
            ${total.toLocaleString('es-UY')}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Icon name="CreditCardIcon" size={20} className="text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Método de Pago</p>
            <p className="text-sm font-medium text-foreground">{paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryCard;
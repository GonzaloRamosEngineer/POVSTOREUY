import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface DeliveryInfoCardProps {
  estimatedDelivery: string;
  trackingNumber?: string;
  shippingMethod: string;
}

const DeliveryInfoCard: React.FC<DeliveryInfoCardProps> = ({
  estimatedDelivery,
  trackingNumber,
  shippingMethod,
}) => {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Información de Envío
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Icon name="TruckIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Método de Envío</p>
            <p className="text-base font-medium text-foreground">{shippingMethod}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="CalendarIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Entrega Estimada</p>
            <p className="text-base font-medium text-foreground">{estimatedDelivery}</p>
          </div>
        </div>

        {trackingNumber && (
          <div className="flex items-start gap-3">
            <Icon name="MapIcon" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Número de Seguimiento</p>
              <p className="text-base font-mono font-medium text-foreground">
                {trackingNumber}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
          <Icon name="ShieldCheckIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Garantía de Envío Uruguay</p>
            <p className="text-xs text-muted-foreground mt-1">
              Envío seguro y rastreable dentro de Uruguay. Soporte local disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfoCard;
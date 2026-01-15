import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface CustomerInfoCardProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  name,
  email,
  phone,
  address,
  city,
  department,
  postalCode,
}) => {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Información de Envío
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Icon name="UserIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Nombre Completo</p>
            <p className="text-base font-medium text-foreground">{name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="EnvelopeIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-base font-medium text-foreground break-all">{email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="PhoneIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Teléfono</p>
            <p className="text-base font-medium text-foreground">{phone}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name="MapPinIcon" size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Dirección de Envío</p>
            <p className="text-base font-medium text-foreground">{address}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {city}, {department} {postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoCard;
import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface EmailConfirmationCardProps {
  email: string;
  supportEmail: string;
  supportPhone: string;
}

const EmailConfirmationCard: React.FC<EmailConfirmationCardProps> = ({
  email,
  supportEmail,
  supportPhone,
}) => {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Confirmación por Email
      </h2>

      <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
        <Icon name="EnvelopeIcon" size={24} className="text-primary mt-0.5" variant="solid" />
        <div>
          <p className="text-base font-medium text-foreground mb-1">
            Email de Confirmación Enviado
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Hemos enviado los detalles de tu pedido a:
          </p>
          <p className="text-sm font-mono font-medium text-foreground break-all">
            {email}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Si no recibes el email en los próximos 10 minutos, revisa tu carpeta de spam o correo no deseado.
        </p>
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <h3 className="text-base font-medium text-foreground">
          ¿Necesitas Ayuda?
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Icon name="EnvelopeIcon" size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email de Soporte</p>
              <a
                href={`mailto:${supportEmail}`}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-smooth"
              >
                {supportEmail}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Icon name="PhoneIcon" size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Teléfono de Soporte</p>
              <a
                href={`tel:${supportPhone}`}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-smooth"
              >
                {supportPhone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationCard;
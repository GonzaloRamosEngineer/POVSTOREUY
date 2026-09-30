import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface EmailConfirmationCardProps {
  email: string;
  supportEmail: string;
  supportPhone: string;
  /**
   * El mail de confirmación sale cuando el pago se acredita, no al generar
   * la orden. Con el pago pendiente (típico en transferencia) hay que
   * prometerlo a futuro, no darlo por enviado: hasta 2026-09-29 esta tarjeta
   * afirmaba haber mandado un mail que no existía.
   */
  paymentCompleted: boolean;
}

const EmailConfirmationCard: React.FC<EmailConfirmationCardProps> = ({
  email,
  supportEmail,
  supportPhone,
  paymentCompleted,
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
            {paymentCompleted ? 'Email de Confirmación Enviado' : 'Te Avisamos por Email'}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {paymentCompleted
              ? 'Enviamos los detalles de tu pedido a:'
              : 'Apenas confirmemos tu pago te enviamos los detalles del pedido a:'}
          </p>
          <p className="text-sm font-mono font-medium text-foreground break-all">
            {email}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {paymentCompleted
            ? 'Si no lo ves en los próximos 10 minutos, revisá tu carpeta de spam o correo no deseado.'
            : 'Guardá esta página: podés volver a este enlace cuando quieras para ver el estado de tu pedido.'}
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
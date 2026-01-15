import React from 'react';
import Icon from '@/components/ui/AppIcon';

const NextStepsCard: React.FC = () => {
  const steps = [
    {
      icon: 'EnvelopeIcon' as const,
      title: 'Confirmación por Email',
      description: 'Recibirás un email con los detalles de tu pedido en los próximos minutos.',
    },
    {
      icon: 'CogIcon' as const,
      title: 'Procesamiento del Pedido',
      description: 'Preparamos tu cámara POV 4K para el envío (1-2 días hábiles).',
    },
    {
      icon: 'TruckIcon' as const,
      title: 'Envío y Entrega',
      description: 'Tu pedido será enviado y recibirás el número de seguimiento.',
    },
    {
      icon: 'StarIcon' as const,
      title: 'Disfruta tu Cámara',
      description: '¡Comienza a filmar en 4K lo que ven tus ojos!',
    },
  ];

  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Próximos Pasos
      </h2>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
              <Icon name={step.icon} size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-foreground mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="UserPlusIcon" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Crea tu Cuenta (Opcional)
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Guarda tu información para futuras compras más rápidas y accede al historial de pedidos.
              </p>
              <button className="text-sm font-medium text-primary hover:text-primary/80 transition-smooth">
                Crear Cuenta →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextStepsCard;
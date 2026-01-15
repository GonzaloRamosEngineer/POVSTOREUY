import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface PaymentStatusCardProps {
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  paymentMethod: string;
  referenceNumber?: string;
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  status,
  transactionId,
  paymentMethod,
  referenceNumber,
}) => {
  const statusConfig = {
    completed: {
      icon: 'CheckCircleIcon' as const,
      text: 'Pago Completado',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    pending: {
      icon: 'ClockIcon' as const,
      text: 'Pago Pendiente',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    failed: {
      icon: 'XCircleIcon' as const,
      text: 'Pago Fallido',
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Estado del Pago
      </h2>

      <div className={`flex items-center gap-3 p-4 rounded-lg ${config.bgColor}`}>
        <Icon name={config.icon} size={24} className={config.color} variant="solid" />
        <div>
          <p className={`text-base font-semibold ${config.color}`}>{config.text}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {status === 'completed' && 'Tu pago ha sido procesado exitosamente'}
            {status === 'pending' && 'Esperando confirmación del pago'}
            {status === 'failed' && 'Hubo un problema con tu pago'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">ID de Transacción</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {transactionId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Método de Pago</span>
          <span className="text-sm font-medium text-foreground">{paymentMethod}</span>
        </div>

        {referenceNumber && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Número de Referencia</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {referenceNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusCard;
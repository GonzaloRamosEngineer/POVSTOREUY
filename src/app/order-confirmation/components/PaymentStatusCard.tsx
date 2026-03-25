import React from 'react';
import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL DICCIONARIO
import { orderMessages } from '@/messages/orderMessages';

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
  const { paymentStatusCard } = orderMessages;

  const statusConfig = {
    completed: {
      icon: 'CheckCircleIcon' as const,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    pending: {
      icon: 'ClockIcon' as const,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    failed: {
      icon: 'XCircleIcon' as const,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
  };

  const config = statusConfig[status];
  // Buscamos los textos correspondientes al estado actual
  const statusData = paymentStatusCard.status[status];

  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        {paymentStatusCard.title}
      </h2>

      <div className={`flex items-center gap-3 p-4 rounded-lg ${config.bgColor}`}>
        <Icon name={config.icon} size={24} className={config.color} variant="solid" />
        <div>
          <p className={`text-base font-semibold ${config.color}`}>{statusData.text}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusData.desc}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{paymentStatusCard.labels.transactionId}</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {transactionId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{paymentStatusCard.labels.paymentMethod}</span>
          <span className="text-sm font-medium text-foreground">{paymentMethod}</span>
        </div>

        {referenceNumber && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{paymentStatusCard.labels.referenceNumber}</span>
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
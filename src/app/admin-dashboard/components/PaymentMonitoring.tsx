import Icon from '@/components/ui/AppIcon';

interface Payment {
  id: string;
  customer: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

interface PaymentMonitoringProps {
  payments: Payment[];
}

export default function PaymentMonitoring({ payments }: PaymentMonitoringProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'failed':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'CheckCircleIcon';
      case 'pending':
        return 'ClockIcon';
      case 'failed':
        return 'XCircleIcon';
      default:
        return 'QuestionMarkCircleIcon';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="bg-card rounded-lg p-6 card-elevation">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="CreditCardIcon" size={24} className="text-primary" variant="solid" />
          <h3 className="text-lg font-heading font-semibold text-foreground">Monitoreo de Pagos</h3>
        </div>
        {pendingPayments.length > 0 && (
          <span className="inline-flex items-center justify-center px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
            {pendingPayments.length} pendientes
          </span>
        )}
      </div>

      <div className="space-y-3">
        {payments.slice(0, 5).map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-smooth"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon
                name={getStatusIcon(payment.status) as any}
                size={20}
                className={payment.status === 'completed' ? 'text-success' : payment.status === 'pending' ? 'text-warning' : 'text-error'}
                variant="solid"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{payment.customer}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{payment.method}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{payment.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <span className="text-sm font-mono font-medium text-primary whitespace-nowrap">
                ${payment.amount.toLocaleString('es-UY')}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(payment.status)}`}>
                {getStatusText(payment.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {pendingPayments.length > 0 && (
        <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0 mt-0.5" variant="solid" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-warning mb-1">Transferencias bancarias pendientes</h4>
              <p className="text-xs text-muted-foreground">
                Hay {pendingPayments.length} transferencia(s) bancaria(s) que requieren verificación manual.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
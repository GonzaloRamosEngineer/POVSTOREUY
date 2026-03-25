import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL DICCIONARIO
import { globalMessages } from '@/messages/globalMessages';

interface StockAlertProps {
  stock: number;
  threshold?: number;
}

export default function StockAlert({ stock, threshold = 5 }: StockAlertProps) {
  if (stock > threshold) {
    return null;
  }

  const { stockAlert } = globalMessages;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-warning/10 border border-warning/20 rounded-md">
      <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0" variant="solid" />
      <p className="text-sm font-medium text-warning">
        {stockAlert.message(stock)}
      </p>
    </div>
  );
}
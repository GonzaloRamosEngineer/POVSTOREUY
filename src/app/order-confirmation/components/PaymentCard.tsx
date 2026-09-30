import Icon from '@/components/ui/AppIcon';
import { formatUYU } from '@/lib/format/currency';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import Card, { CardTitle } from './Card';

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-600/10 text-green-700',
  pending: 'bg-orange-600/10 text-orange-700',
  failed: 'bg-red-600/10 text-red-700',
  refunded: 'bg-zinc-500/10 text-zinc-700',
};

type Props = {
  method: string;
  status: string;
  total: number;
  transactionId: string | null;
};

export default function PaymentCard({ method, status, total, transactionId }: Props) {
  const m = orderTrackingMessages.payment;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>{m.title}</CardTitle>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status] ?? STATUS_STYLE.pending}`}
        >
          {m.status[status] ?? m.status.pending}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
          <Icon
            name={method === 'bank_transfer' ? 'BuildingLibraryIcon' : 'CreditCardIcon'}
            size={20}
            className="text-foreground"
          />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{m.methods[method] ?? method}</p>
          <p className="text-sm text-muted-foreground">{formatUYU(total)}</p>
        </div>
      </div>

      {transactionId && (
        <p className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{m.transactionId}</span>
          <span className="truncate font-mono text-foreground">{transactionId}</span>
        </p>
      )}
    </Card>
  );
}

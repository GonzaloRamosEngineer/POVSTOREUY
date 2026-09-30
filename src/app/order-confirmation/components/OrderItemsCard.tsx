import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { formatUYU } from '@/lib/format/currency';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import Card, { CardTitle } from './Card';

export type OrderLineView = {
  key: string;
  name: string;
  image: string;
  quantity: number;
  totalPrice: number;
  components: { key: string; name: string; quantity: number }[];
};

type Props = {
  lines: OrderLineView[];
  subtotal: number;
  shipping: number;
  total: number;
};

export default function OrderItemsCard({ lines, subtotal, shipping, total }: Props) {
  const m = orderTrackingMessages.items;
  const unitCount = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>{m.title}</CardTitle>
        <span className="text-sm text-muted-foreground">{m.count(unitCount)}</span>
      </div>

      <ul className="mt-2 divide-y divide-border">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-4 py-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-20 sm:w-20">
              {line.image ? (
                <AppImage src={line.image} alt={line.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <Icon name="PhotoIcon" size={22} className="text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-snug text-foreground">{line.name}</p>
                <p className="whitespace-nowrap font-heading font-semibold text-foreground">
                  {formatUYU(line.totalPrice)}
                </p>
              </div>

              {line.quantity > 1 && (
                <p className="mt-0.5 text-sm text-muted-foreground">{m.quantity(line.quantity)}</p>
              )}

              {line.components.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {m.includes}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {line.components.map((c) => (
                      <li key={c.key} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="CheckIcon" size={14} className="mt-[3px] shrink-0 text-green-600" />
                        <span>
                          {c.name}
                          {c.quantity > 1 && <span className="text-foreground"> × {c.quantity}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{m.subtotal}</dt>
          <dd className="text-foreground">{formatUYU(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{m.shipping}</dt>
          <dd className={shipping > 0 ? 'text-foreground' : 'font-medium text-green-600'}>
            {shipping > 0 ? formatUYU(shipping) : m.shippingFree}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-heading text-base font-semibold text-foreground">{m.total}</dt>
          <dd className="font-heading text-xl font-bold tracking-tight text-foreground">{formatUYU(total)}</dd>
        </div>
      </dl>
    </Card>
  );
}

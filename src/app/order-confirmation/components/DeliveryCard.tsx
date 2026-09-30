import Icon from '@/components/ui/AppIcon';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import Card, { CardTitle } from './Card';

type Props = {
  isPickup: boolean;
  pickupAddress: string | null;
  address: string;
  city: string;
  department: string;
  postalCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** La entrega estimada sólo se muestra mientras el pedido no llegó. */
  showEstimate: boolean;
};

export default function DeliveryCard(props: Props) {
  const m = orderTrackingMessages.delivery;
  const { isPickup } = props;

  const locality = [props.city, props.department].filter(Boolean).join(', ');
  const mapsUrl = props.pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.pickupAddress)}`
    : null;

  return (
    <Card>
      <CardTitle>{m.title}</CardTitle>

      <div className="mt-4 flex gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
          <Icon name={isPickup ? 'BuildingStorefrontIcon' : 'TruckIcon'} size={20} className="text-foreground" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{isPickup ? m.pickup : m.delivery}</p>

          {isPickup ? (
            <>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{props.pickupAddress}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <Icon name="MapPinIcon" size={16} />
                  {m.directions}
                </a>
              )}
              {props.showEstimate && <p className="mt-2 text-sm text-muted-foreground">{m.pickupHowTo}</p>}
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {props.address}
                {locality && (
                  <>
                    <br />
                    {locality}
                    {props.postalCode ? ` · CP ${props.postalCode}` : ''}
                  </>
                )}
              </p>
              {props.showEstimate && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon name="ClockIcon" size={16} className="shrink-0" />
                  {m.estimate}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4 text-sm">
        <p className="text-muted-foreground">
          {m.recipient}: <span className="font-medium text-foreground">{props.customerName}</span>
        </p>
        <p className="mt-1 break-words text-muted-foreground">
          {[props.customerPhone, props.customerEmail].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Card>
  );
}

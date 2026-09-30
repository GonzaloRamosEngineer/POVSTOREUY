import Icon from '@/components/ui/AppIcon';
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '@/config/contact';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import Card from './Card';

export default function HelpCard({ orderNumber }: { orderNumber: string }) {
  const m = orderTrackingMessages;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    m.help.whatsappMessage(orderNumber)
  )}`;

  return (
    <Card as="aside" className="print:hidden">
      <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">{m.help.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.help.body}</p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        <Icon name="ChatBubbleLeftRightIcon" size={18} className="text-green-500" />
        {m.help.whatsapp}
      </a>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {m.help.email}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-foreground underline-offset-2 hover:underline">
          {SUPPORT_EMAIL}
        </a>
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
        {m.trust.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm text-foreground">
            <Icon name={item.icon} size={18} className="shrink-0 text-muted-foreground" />
            {item.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

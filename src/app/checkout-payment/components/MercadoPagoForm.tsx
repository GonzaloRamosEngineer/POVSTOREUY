'use client';

import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL DICCIONARIO
import { checkoutMessages } from '@/messages/checkoutMessages';

interface MercadoPagoFormProps {
  onPay: () => void;
  isProcessing: boolean;
}

export default function MercadoPagoForm({ onPay, isProcessing }: MercadoPagoFormProps) {
  const { mercadoPagoForm } = checkoutMessages;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
        <Icon name="LockClosedIcon" size={20} className="text-success" variant="solid" />
        <div>
          <p className="text-sm font-medium text-foreground">{mercadoPagoForm.securePaymentTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mercadoPagoForm.securePaymentDesc}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={isProcessing}
        onClick={onPay}
        className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            {mercadoPagoForm.processing}
          </>
        ) : (
          <>
            <Icon name="CreditCardIcon" size={20} className="text-primary-foreground" variant="solid" />
            {mercadoPagoForm.payButton}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">{mercadoPagoForm.acceptedCardsLabel}</div>
        <div className="flex items-center gap-2">
          {mercadoPagoForm.cards.map(card => (
            <div key={card} className="px-3 py-1 bg-muted rounded text-xs font-medium text-foreground">
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'use client';

import Icon from '@/components/ui/AppIcon';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: string;
  onSelect: (methodId: string) => void;
}

export default function PaymentMethodSelector({
  methods,
  selectedMethod,
  onSelect
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-heading font-semibold text-foreground">
        Método de Pago
      </h3>
      <div className="space-y-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-smooth focus-ring ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-muted-foreground'
            }`}
            aria-label={`Select ${method.name} payment method`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
              selectedMethod === method.id ? 'bg-primary' : 'bg-muted'
            }`}>
              <Icon
                name={method.icon as any}
                size={24}
                className={selectedMethod === method.id ? 'text-primary-foreground' : 'text-foreground'}
                variant="solid"
              />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-foreground">
                  {method.name}
                </span>
                {method.badge && (
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded">
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {method.description}
              </p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === method.id
                ? 'border-primary bg-primary' :'border-border'
            }`}>
              {selectedMethod === method.id && (
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
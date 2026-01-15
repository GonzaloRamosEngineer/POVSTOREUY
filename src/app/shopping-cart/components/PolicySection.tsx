'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface PolicyItem {
  id: string;
  title: string;
  content: string[];
}

const policies: PolicyItem[] = [
  {
    id: 'shipping',
    title: 'Política de Envío',
    content: [
      'Envío gratis a todo Uruguay en compras superiores a $2.000',
      'Entregas en Montevideo: 24-48 horas hábiles',
      'Entregas en el interior: 3-5 días hábiles',
      'Seguimiento en tiempo real de tu pedido',
      'Empaque discreto y seguro'
    ]
  },
  {
    id: 'returns',
    title: 'Política de Devoluciones',
    content: [
      'Devoluciones aceptadas dentro de los 30 días',
      'Producto debe estar en condiciones originales',
      'Reembolso completo o cambio por otro producto',
      'Gastos de envío de devolución a cargo del cliente',
      'Proceso de devolución simple y rápido'
    ]
  },
  {
    id: 'warranty',
    title: 'Garantía del Producto',
    content: [
      'Garantía de 12 meses en todos los productos',
      'Cubre defectos de fabricación',
      'Soporte técnico gratuito',
      'Reparación o reemplazo sin costo adicional',
      'Atención al cliente en español'
    ]
  }
];

export default function PolicySection() {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const togglePolicy = (policyId: string) => {
    setExpandedPolicy(expandedPolicy === policyId ? null : policyId);
  };

  return (
    <div className="space-y-4">
      {policies.map((policy) => (
        <div
          key={policy.id}
          className="bg-card rounded-lg border border-border overflow-hidden"
        >
          <button
            onClick={() => togglePolicy(policy.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-smooth focus-ring"
            aria-expanded={expandedPolicy === policy.id}
          >
            <span className="text-base font-heading font-semibold text-foreground">
              {policy.title}
            </span>
            <Icon
              name="ChevronDownIcon"
              size={20}
              className={`text-foreground transition-transform ${
                expandedPolicy === policy.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedPolicy === policy.id && (
            <div className="px-4 pb-4 space-y-2">
              {policy.content.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Icon
                    name="CheckCircleIcon"
                    size={20}
                    className="text-success flex-shrink-0 mt-0.5"
                    variant="solid"
                  />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
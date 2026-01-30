'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface PolicyItem {
  id: string;
  title: string;
  iconName: string;
  content: string[];
}

const policies: PolicyItem[] = [
  {
    id: 'shipping',
    title: 'Envíos y Despacho',
    iconName: 'TruckIcon',
    content: [
      'Envío GRATIS en compras mayores a $2.000',
      'Despachamos en 24hs hábiles',
      'Cobertura a todo Uruguay (DAC, Mirtrans)',
      'Tiempo estimado agencia: 24 a 48hs',
      'Empaque seguro y discreto'
    ]
  },
  {
    id: 'returns',
    title: 'Cambios y Devoluciones',
    iconName: 'ArrowPathRoundedSquareIcon',
    content: [
      'Plazo: 5 días hábiles por arrepentimiento',
      'Condición: Producto SELLADO y sin uso',
      'El empaque debe estar intacto (film original)',
      'No aceptamos productos abiertos (higiene)',
      'Gestión simple contactando a soporte'
    ]
  },
  {
    id: 'warranty',
    title: 'Garantía Oficial',
    iconName: 'ShieldCheckIcon',
    content: [
      '3 Meses (90 días) por defectos de fábrica',
      'Respaldo local directo con nosotros',
      'Cubre fallas de encendido o software',
      'NO cubre daños por agua, golpes o mal uso',
      'Soporte técnico real en Uruguay'
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
          className="bg-card border border-border rounded-lg overflow-hidden transition-all"
        >
          <button
            onClick={() => togglePolicy(policy.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-smooth focus:outline-none"
            aria-expanded={expandedPolicy === policy.id}
          >
            <div className="flex items-center gap-3">
              {/* Ícono representativo */}
              <Icon 
                name={policy.iconName as any} 
                size={20} 
                className="text-muted-foreground" 
              />
              <span className="text-sm font-bold text-foreground">
                {policy.title}
              </span>
            </div>
            <Icon
              name="ChevronDownIcon"
              size={16}
              className={`text-muted-foreground transition-transform duration-300 ${
                expandedPolicy === policy.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedPolicy === policy.id && (
            <div className="px-4 pb-4 pl-11 space-y-2 animate-in slide-in-from-top-1 duration-200">
              {policy.content.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
import React from 'react';

/** Contenedor base de las tarjetas de la página de pedido. */
export default function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'section' | 'aside' | 'div';
}) {
  return (
    <Tag className={`rounded-2xl border border-border bg-background p-5 sm:p-6 ${className}`}>
      {children}
    </Tag>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{children}</h2>
  );
}

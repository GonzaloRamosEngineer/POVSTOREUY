'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { OrderProgress } from '@/lib/orders/orderProgress';
import { orderTrackingMessages } from '@/messages/orderTrackingMessages';
import { TONE } from './tones';

const EASE_OUT = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

export default function ProgressStepper({ progress }: { progress: OrderProgress }) {
  const { steps, current, tone, isPickup, kind } = progress;

  // El tramo recorrido se "llena" una vez al montar: la página se ve pocas
  // veces por pedido, así que un gesto de progreso suma sin molestar. Con
  // reduced-motion la barra aparece directamente en su lugar.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!steps) return null;

  const t = TONE[tone];
  const method = isPickup ? 'pickup' : 'delivery';
  const awaitingPayment = kind === 'awaiting_payment';
  const lastIndex = steps.length - 1;
  const progressRatio = lastIndex === 0 ? 0 : current / lastIndex;

  return (
    <div className="relative">
      {/* Riel + tramo recorrido. Va de centro a centro del primer y último nodo. */}
      <div className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 -translate-y-1/2 rounded-full bg-border" aria-hidden />
      <div
        className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 -translate-y-1/2 overflow-hidden rounded-full"
        aria-hidden
      >
        <div
          className={`h-full origin-left rounded-full ${t.bar} motion-safe:transition-transform motion-safe:duration-700 motion-safe:delay-150 ${EASE_OUT}`}
          style={{ transform: `scaleX(${filled ? progressRatio : 0})` }}
        />
      </div>

      <ol className="relative grid grid-cols-4">
        {steps.map((key, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const label = orderTrackingMessages.steps[key][method];

          let node: React.ReactNode;
          if (isCurrent && awaitingPayment) {
            node = (
              <span className={`grid h-8 w-8 place-items-center rounded-full ring-4 ${t.solid} ${t.ring}`}>
                <Icon name="ClockIcon" size={16} variant="solid" className="text-white" />
              </span>
            );
          } else if (done || (isCurrent && kind === 'delivered')) {
            node = (
              <span className={`grid h-8 w-8 place-items-center rounded-full ${t.solid}`}>
                <Icon name="CheckIcon" size={16} className="text-white" />
              </span>
            );
          } else if (isCurrent) {
            node = (
              <span className={`grid h-8 w-8 place-items-center rounded-full ring-4 ${t.solid} ${t.ring}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            );
          } else {
            node = (
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-border bg-background">
                <span className="h-1.5 w-1.5 rounded-full bg-border" />
              </span>
            );
          }

          return (
            <li
              key={key}
              className="flex flex-col items-center text-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {node}
              <span
                className={`mt-2 px-1 text-[11px] leading-tight sm:text-xs ${
                  isCurrent
                    ? 'font-medium text-foreground'
                    : done
                      ? 'text-zinc-700'
                      : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Clases por tono semántico de la etapa del pedido.
//
// Usa la paleta de Tailwind y no los tokens del tema (`bg-primary/10`):
// los tokens están definidos como `var(--color-x)` sin canal alfa y en
// Tailwind 3 el modificador de opacidad falla EN SILENCIO — no genera la
// clase. red-600 = #DC2626 (primary), green-600 = #16a34a (success),
// orange-600 = #ea580c (warning): son los mismos hex del tema.
//
// Strings completos a propósito: el JIT de Tailwind sólo ve clases literales.

import type { ProgressTone } from '@/lib/orders/orderProgress';

export const TONE: Record<
  ProgressTone,
  { solid: string; text: string; soft: string; ring: string; bar: string }
> = {
  progress: {
    solid: 'bg-red-600 text-white',
    text: 'text-red-600',
    soft: 'bg-red-600/10 text-red-600',
    ring: 'ring-red-600/15',
    bar: 'bg-red-600',
  },
  success: {
    solid: 'bg-green-600 text-white',
    text: 'text-green-600',
    soft: 'bg-green-600/10 text-green-600',
    ring: 'ring-green-600/15',
    bar: 'bg-green-600',
  },
  warning: {
    solid: 'bg-orange-600 text-white',
    text: 'text-orange-600',
    soft: 'bg-orange-600/10 text-orange-600',
    ring: 'ring-orange-600/15',
    bar: 'bg-orange-600',
  },
  danger: {
    solid: 'bg-red-600 text-white',
    text: 'text-red-600',
    soft: 'bg-red-600/10 text-red-600',
    ring: 'ring-red-600/15',
    bar: 'bg-red-600',
  },
  neutral: {
    solid: 'bg-zinc-500 text-white',
    text: 'text-zinc-500',
    soft: 'bg-zinc-500/10 text-zinc-600',
    ring: 'ring-zinc-500/15',
    bar: 'bg-zinc-400',
  },
};

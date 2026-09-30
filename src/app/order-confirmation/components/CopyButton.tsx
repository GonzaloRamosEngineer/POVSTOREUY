'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Sin permiso de portapapeles (iframe, http): el número igual queda
      // visible y seleccionable, así que no mostramos error.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      <Icon
        name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'}
        size={16}
        className={copied ? 'text-green-600' : 'text-muted-foreground'}
      />
      <span>{copied ? copiedLabel : label}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </button>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { orderLookupMessages } from '@/messages/orderLookupMessages';
import { WHATSAPP_URL } from '@/config/contact';

export default function SeguimientoContent() {
  const router = useRouter();
  const { page, errors } = orderLookupMessages;

  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderNumber.trim() || !email.trim()) {
      setError(errors.missingFields);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || errors.notFound);
        return;
      }

      // Mismo destino que el link de los mails: la pantalla de confirmación
      // con el token firmado. No duplicamos la vista del pedido.
      router.push(
        `/order-confirmation?orderId=${encodeURIComponent(data.orderId)}&token=${encodeURIComponent(data.token)}`
      );
    } catch {
      setError(errors.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-red-500 font-bold tracking-widest text-sm uppercase">
            Tu compra
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">{page.title}</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">{page.subtitle}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-800 shadow-xl space-y-6"
        >
          <div className="space-y-2">
            <label htmlFor="orderNumber" className="block text-sm font-medium text-white">
              {page.orderNumberLabel}
            </label>
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder={page.orderNumberPlaceholder}
              autoComplete="off"
              className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500">{page.orderNumberHelp}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white">
              {page.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={page.emailPlaceholder}
              autoComplete="email"
              className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
            >
              <Icon name="ExclamationTriangleIcon" size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? page.submitting : page.submit}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <h2 className="text-sm font-semibold text-white">{page.helpTitle}</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">{page.helpBody}</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={16} />
            {page.helpCta}
          </a>
        </div>
      </div>
    </div>
  );
}

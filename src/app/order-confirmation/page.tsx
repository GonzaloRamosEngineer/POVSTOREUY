import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderConfirmationInteractive from './components/OrderConfirmationInteractive';

export const metadata: Metadata = {
  title: 'Tu pedido | POV Store Uruguay',
  description: 'Estado de tu pedido en POV Store Uruguay: preparación, envío y seguimiento.',
  // Página con datos personales detrás de un token: nunca indexable.
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="h-72 animate-pulse rounded-2xl border border-border bg-background" />
          </div>
        </div>
      }
    >
      <OrderConfirmationInteractive />
    </Suspense>
  );
}
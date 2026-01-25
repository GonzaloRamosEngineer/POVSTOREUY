'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const NewsletterSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setEmail('');
        setIsSubmitted(false);
      }, 3000);
    }
  };

  if (!isHydrated) {
    return (
      /* TECH NOIR: Fondo negro con leve tinte rojo */
      <section className="py-16 px-4 bg-gradient-to-b from-black to-neutral-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
            <Icon name="EnvelopeIcon" size={32} className="text-red-500" variant="solid" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Recibí ofertas exclusivas
          </h2>
          <p className="text-lg text-neutral-400 mb-8">
            Suscribite a nuestro newsletter y obtené un 10% de descuento en tu primera compra
          </p>
          <form className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value=""
                onChange={() => {}}
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg"
              >
                Suscribirme
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    /* TECH NOIR: Fondo negro con leve tinte rojo y borde sutil */
    <section className="py-20 px-4 bg-gradient-to-b from-black via-neutral-950 to-neutral-900 border-t border-white/5 relative overflow-hidden">
      {/* Efecto de luz roja ambiental */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-600/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 rounded-full mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <Icon name="EnvelopeIcon" size={32} className="text-red-500" variant="solid" />
        </div>

        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 drop-shadow-md">
          Recibí ofertas exclusivas
        </h2>

        <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto font-light">
          Suscribite a nuestro newsletter y obtené un <span className="text-red-400 font-semibold">10% de descuento</span> en tu primera compra. Además, enterate primero de nuevos productos y promociones especiales.
        </p>

        {isSubmitted ? (
          <div className="max-w-md mx-auto p-6 bg-green-900/10 border border-green-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <Icon name="CheckCircleIcon" size={24} variant="solid" />
              <p className="font-semibold">¡Gracias por suscribirte!</p>
            </div>
            <p className="text-sm text-neutral-400 mt-2">
              Revisá tu email para confirmar la suscripción
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="flex-1 px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] transform hover:scale-105"
              >
                Suscribirme
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-4">
              Al suscribirte, aceptás recibir emails promocionales. Podés darte de baja en cualquier momento.
            </p>
          </form>
        )}

        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheckIcon" size={18} className="text-neutral-400" />
            <span>Datos protegidos</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="EnvelopeIcon" size={18} className="text-neutral-400" />
            <span>Sin spam</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="XMarkIcon" size={18} className="text-neutral-400" />
            <span>Cancelá cuando quieras</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
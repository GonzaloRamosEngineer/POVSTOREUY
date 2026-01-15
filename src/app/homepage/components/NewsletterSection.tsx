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
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
            <Icon name="EnvelopeIcon" size={32} className="text-primary" variant="solid" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Recibí ofertas exclusivas
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Suscribite a nuestro newsletter y obtené un 10% de descuento en tu primera compra
          </p>
          <form className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value=""
                onChange={() => {}}
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg"
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
    <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
          <Icon name="EnvelopeIcon" size={32} className="text-primary" variant="solid" />
        </div>

        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
          Recibí ofertas exclusivas
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Suscribite a nuestro newsletter y obtené un 10% de descuento en tu primera compra. Además, enterate primero de nuevos productos y promociones especiales.
        </p>

        {isSubmitted ? (
          <div className="max-w-md mx-auto p-6 bg-success/10 border border-success rounded-lg">
            <div className="flex items-center justify-center gap-3 text-success">
              <Icon name="CheckCircleIcon" size={24} variant="solid" />
              <p className="font-semibold">¡Gracias por suscribirte!</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
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
                className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-smooth focus-ring shadow-md hover:shadow-lg"
              >
                Suscribirme
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Al suscribirte, aceptás recibir emails promocionales. Podés darte de baja en cualquier momento.
            </p>
          </form>
        )}

        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheckIcon" size={20} className="text-success" />
            <span>Datos protegidos</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="EnvelopeIcon" size={20} className="text-primary" />
            <span>Sin spam</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="XMarkIcon" size={20} className="text-muted-foreground" />
            <span>Cancelá cuando quieras</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
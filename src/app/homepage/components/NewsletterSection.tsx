'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const NewsletterSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsHydrated(true);
    
    // Countdown timer para el próximo día 7 del mes
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let targetDate: Date;
      
      if (currentDay < 7) {
        targetDate = new Date(currentYear, currentMonth, 7, 0, 0, 0);
      } else {
        targetDate = new Date(currentYear, currentMonth + 1, 7, 0, 0, 0);
      }
      
      const difference = targetDate.getTime() - now.getTime();
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage('Por favor ingresá tu email');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        
        if (data.alreadySubscribed) {
          setSuccessMessage('Ya estás en la lista VIP.');
        } else if (data.reactivated) {
          setSuccessMessage('Bienvenido de vuelta.');
        } else {
          setSuccessMessage('Perfecto. Revisá tu email.');
        }

        setTimeout(() => {
          setEmail('');
          setIsSubmitted(false);
          setSuccessMessage('');
        }, 5000);
      } else {
        setErrorMessage(data.error || 'Hubo un error al procesar tu suscripción');
      }
    } catch (error) {
      console.error('Error submitting newsletter:', error);
      setErrorMessage('Error de conexión. Por favor intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden border-t border-neutral-900">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Acceso VIP a <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-600">ofertas exclusivas</span>
          </h2>
          
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            10% OFF inmediato + ofertas flash de hasta 40% de descuento
          </p>
        </div>

        {/* FORMULARIO O SUCCESS */}
        {isSubmitted ? (
          <div className="max-w-md mx-auto rounded-2xl border border-green-900/30 bg-neutral-900/30 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/20 rounded-full mb-4">
              <Icon name="CheckCircleIcon" size={32} className="text-green-500" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              ¡Listo!
            </h3>
            
            <p className="text-neutral-400 mb-6">
              {successMessage}
            </p>
            
            <div className="rounded-xl border border-green-900/30 bg-black/30 p-4">
              <p className="text-sm text-neutral-400 mb-2">
                Tu código 10% OFF:
              </p>
              <code className="text-green-500 font-mono font-bold text-xl">
                WELCOME10
              </code>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            
            {/* Formulario */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="tu@email.com"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3.5 bg-black/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-900/10 border border-red-900/30 text-sm text-red-400">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Obtener 10% OFF
                      <Icon name="ArrowRightIcon" size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Beneficios compactos */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800">
                <div className="text-2xl font-bold text-white mb-1">10%</div>
                <div className="text-xs text-neutral-500">OFF inmediato</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800">
                <div className="text-2xl font-bold text-white mb-1">40%</div>
                <div className="text-xs text-neutral-500">Ofertas flash</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800">
                <div className="text-2xl font-bold text-white mb-1">1x</div>
                <div className="text-xs text-neutral-500">Por mes</div>
              </div>
            </div>

            {/* Contador */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
              <div className="text-center text-neutral-400 text-xs uppercase tracking-wider mb-3">
                Próximo envío: día 7
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: timeLeft.days, label: 'D' },
                  { value: timeLeft.hours, label: 'H' },
                  { value: timeLeft.minutes, label: 'M' },
                  { value: timeLeft.seconds, label: 'S' },
                ].map((time, idx) => (
                  <div key={idx} className="text-center">
                    <div className="bg-black/50 rounded-lg p-2 mb-1">
                      <span className="text-xl font-bold text-white tabular-nums">
                        {String(time.value).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-600">
                      {time.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social proof simple */}
            <div className="text-center text-sm text-neutral-500">
              <span className="text-white font-semibold">+75</span> personas ya se unieron
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default NewsletterSection;
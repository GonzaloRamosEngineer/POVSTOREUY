'use client';

import { GifIcon } from '@heroicons/react/24/outline';
import { Zap, Truck, CreditCard, Package, Shield, Clock, GiftIcon, RocketIcon } from 'lucide-react';

const MarqueeBanner = () => {
  const messages = [
    {
      icon: <Package className="w-4 h-4" />,
      text: "ÚLTIMAS UNIDADES EN STOCK",
      highlight: true, // Urgencia máxima
    },
    {
      icon: <Truck className="w-4 h-4" />,
      text: "ENVÍO GRATIS 24-48HS",
      highlight: false,
    },
    {
      icon: <Zap className="w-4 h-4" />,
      text: "POV 4K HANDS-FREE • CALIDAD PROFESIONAL",
      highlight: false,
    },
    {
      icon: <CreditCard className="w-4 h-4" />,
      text: "HASTA 12 CUOTAS SIN INTERÉS",
      highlight: false,
    },
    {
      icon: <RocketIcon className="w-4 h-4" />,
      text: "LLEGADA SEGUNDO DROP 02/03",
      highlight: false,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: "OFERTA VÁLIDA HOY",
      highlight: true,
    },
  ];

  return (
    <div className="relative w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 overflow-hidden shadow-lg">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      {/* Ruido sutil para textura premium */}
      <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
      
      <div className="relative flex py-3">
        {/* Primera pasada del marquee */}
        <div className="flex animate-marquee-smooth whitespace-nowrap">
          {messages.map((msg, idx) => (
            <div
              key={`msg-1-${idx}`}
              className={`flex items-center gap-2.5 px-6 border-r border-white/20 ${
                msg.highlight ? 'animate-pulse-glow' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${msg.highlight ? 'text-yellow-300 animate-bounce-subtle' : 'text-white/90'}`}>
                {msg.icon}
              </div>
              <span
                className={`text-sm font-bold tracking-wide ${
                  msg.highlight
                    ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]'
                    : 'text-white'
                }`}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>

        {/* Segunda pasada del marquee (para loop seamless) */}
        <div className="flex animate-marquee-smooth whitespace-nowrap" aria-hidden="true">
          {messages.map((msg, idx) => (
            <div
              key={`msg-2-${idx}`}
              className={`flex items-center gap-2.5 px-6 border-r border-white/20 ${
                msg.highlight ? 'animate-pulse-glow' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${msg.highlight ? 'text-yellow-300 animate-bounce-subtle' : 'text-white/90'}`}>
                {msg.icon}
              </div>
              <span
                className={`text-sm font-bold tracking-wide ${
                  msg.highlight
                    ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]'
                    : 'text-white'
                }`}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-smooth {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-marquee-smooth {
          animation: marquee-smooth 30s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeBanner;
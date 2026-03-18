'use client';

import { Package, Zap, Clock, RocketIcon } from 'lucide-react';

const MarqueeBanner = () => {
  const messages = [
    {
      icon: <Package className="w-4 h-4" />,
      text: "🔥 ÚLTIMAS UNIDADES CON PRECIO PROMOCIONAL 🔥",
      highlight: true, 
    },
    {
      icon: <Zap className="w-4 h-4" />,
      text: "KITS CON STOCK MUY LIMITADO",
      highlight: false,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: "⏳ LA OFERTA ESPECIAL ACABA HOY",
      highlight: true,
    },
    {
      icon: <RocketIcon className="w-4 h-4" />,
      text: "LLEGADA SEGUNDO DROP 02/03",
      highlight: false,
    }
  ];

  return (
    <div className="relative w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
      
      {/* Añadido w-full y overflow-hidden para evitar cortes en mobile */}
      <div className="relative flex py-2.5 w-full overflow-hidden">
        
        {/* Agregado min-w-full y flex-shrink-0 para que funcione el loop en iPhone/Android */}
        <div className="flex min-w-full flex-shrink-0 animate-marquee-smooth whitespace-nowrap">
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
                className={`text-[13px] font-black tracking-widest uppercase ${
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

        <div className="flex min-w-full flex-shrink-0 animate-marquee-smooth whitespace-nowrap" aria-hidden="true">
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
                className={`text-[13px] font-black tracking-widest uppercase ${
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
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-marquee-smooth { animation: marquee-smooth 25s linear infinite; }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MarqueeBanner;
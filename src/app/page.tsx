'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Instagram, Zap, Camera , MessageCircle, Clapperboard, Mountain, PawPrint } from 'lucide-react';

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [intensity, setIntensity] = useState(0);

  const [votes, setVotes] = useState({
    creators: 1240,
    adventurers: 856,
    pets: 642
  });
  
  const handleVote = (team) => {
    setVotes(prev => ({ ...prev, [team]: prev[team] + 1 }));
  };

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date('2026-01-30T00:00:00-03:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      const total = targetDate - new Date('2026-01-25T00:00:00-03:00').getTime();
      setIntensity(1 - (distance / total));

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const urgencyPhrases = [
    "El futuro de los creadores",
    "Algo grande está llegando",
    "La espera casi termina",
    "Prepárate para el cambio",
    "Drop 01 Viernes 30/01",
    "Powered by SJCAM - Tecnología Oficial -"
  ];

  const currentPhrase = urgencyPhrases[Math.floor((timeLeft.seconds / 15) % urgencyPhrases.length)];

  return (
    <main className="relative min-h-screen w-full bg-black text-white overflow-x-hidden">
      
      {/* Fondo Atmosférico */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        {/* Grid Sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        
        {/* Ruido de película */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
        
        {/* Aura Roja Pulsante */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] transition-all duration-1000"
          style={{
            width: `${40 + intensity * 30}vw`,
            height: `${40 + intensity * 30}vw`,
            maxWidth: '1000px',
            maxHeight: '1000px',
            background: `radial-gradient(circle, rgba(220,38,38,${0.15 + intensity * 0.15}) 0%, transparent 70%)`,
            animation: 'pulse-breath 4s ease-in-out infinite'
          }}
        />
        
        {/* Lens Flare */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Partículas Flotantes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Contenedor Principal Centrado */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 sm:gap-8 md:gap-10">
          
          {/* Logo POV */}
          <div className="relative group animate-fade-in-down w-full flex justify-center">
            {/* Glow principal */}
            <div className="absolute inset-0 flex justify-center items-start">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 bg-gradient-to-r from-red-600/20 via-red-500/30 to-red-600/20 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse-slow" />
            </div>
            
            {/* Anillo giratorio */}
            <div className="absolute inset-0 flex justify-center items-start">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-spin-slow" />
            </div>
            
            {/* Logo */}
                      <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 group-hover:scale-110 transition-transform duration-500">
              <Image 
                src="/images/logo-pov.png"
                alt="POV Store Logo" 
                fill
                className="object-contain drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all duration-500 group-hover:drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Badge de Ubicación */}
          <div 
            className="flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-red-950/20 border border-red-900/30 backdrop-blur-md animate-fade-in" 
            style={{ animationDelay: '0.1s' }}
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.25em] text-red-400 uppercase">Montevideo, Uruguay</span>
          </div>

          {/* Headline */}
          <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            <div className="relative inline-block">
              <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-light text-neutral-400 tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1 sm:mb-2">
                {currentPhrase}
              </h2>
              <div className="h-px w-1/3 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black tracking-tighter leading-[0.85] relative">
              <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-b from-red-500/20 to-transparent blur-2xl">
                POV STORE
              </span>
              <span className="relative text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-600">
                POV STORE
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-neutral-400 tracking-wide sm:tracking-widest max-w-xs sm:max-w-md md:max-w-2xl mx-auto font-light px-4">
              Tu vida en primera persona
            </p>


            <div className="pt-4 sm:pt-6">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-red-500/30 bg-red-950/30 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                <span className="text-sm sm:text-base md:text-lg font-mono font-bold text-red-100 tracking-widest uppercase">
                  Apertura: Viernes 30/01 <span className="text-red-500 mx-1">|</span> 12:00 HS
                </span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
              </div>
            </div>



          </div>

          {/* Countdown */}
          <div className="w-full max-w-5xl relative animate-fade-in-up px-2 sm:px-4" style={{ animationDelay: '0.3s' }}>
            {/* Glow de fondo */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-red-600/10 via-red-500/20 to-red-600/10 blur-3xl rounded-3xl" />
            
            <div className="relative border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <TimeUnit value={timeLeft.days} label="Días" icon={<Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />} isPrimary />
                <TimeUnit value={timeLeft.hours} label="Horas" />
                <TimeUnit value={timeLeft.minutes} label="Minutos" />
                <TimeUnit value={timeLeft.seconds} label="Segundos" isAnimated />
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 sm:mt-6 md:mt-8 h-0.5 sm:h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 transition-all duration-1000 rounded-full"
                  style={{ width: `${intensity * 100}%` }}
                />
              </div>
            </div>
          </div>

{/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-stretch sm:items-center w-full max-w-md sm:max-w-none px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            
            {/* Botón Instagram */}
            <a 
              href="https://www.instagram.com/povstore.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 flex-1 sm:flex-initial"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 sm:gap-3 text-white font-bold tracking-wide">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">SÍGUENOS EN INSTAGRAM</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </a>
            
            {/* Botón Lista VIP (WhatsApp) */}
            <a 
              href="https://wa.me/59897801202?text=Hola!%20Quiero%20unirme%20a%20la%20Lista%20VIP%20de%20POV%20Store."
              target="_blank"
              rel="noopener noreferrer"
              className="group px-6 sm:px-8 py-3 sm:py-4 rounded-full border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300 hover:bg-white/5 flex-1 sm:flex-initial"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-white/80 group-hover:text-white font-bold tracking-wide">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">UNIRME A LA LISTA VIP</span>
              </div>
            </a>

          </div>


          {/* Sección de Votación Interactiva */}
          <div className="w-full max-w-4xl mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-center mb-8">
              <h3 className="text-sm md:text-base text-white/60 font-light tracking-[0.2em] uppercase mb-2">
                Elige tu estilo
              </h3>
              <div className="h-px w-12 mx-auto bg-red-500/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 sm:px-0">
              {/* Card 1: Team Creators */}
              <button 
                onClick={() => handleVote('creators')}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-red-900/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-500/20 text-white/70 group-hover:text-red-400 transition-colors">
                    <Clapperboard className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold tracking-widest text-neutral-400 group-hover:text-white mb-1">TEAM</span>
                    <span className="block text-sm font-bold text-white">CREADORES DE CONTENIDO</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:from-red-400 group-hover:to-red-600">
                    {votes.creators.toLocaleString()}
                  </div>
                </div>
              </button>

              {/* Card 2: Team Adventure */}
              <button 
                onClick={() => handleVote('adventurers')}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-red-900/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-500/20 text-white/70 group-hover:text-red-400 transition-colors">
                    <Mountain className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold tracking-widest text-neutral-400 group-hover:text-white mb-1">TEAM</span>
                    <span className="block text-sm font-bold text-white">AVENTURA</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:from-red-400 group-hover:to-red-600">
                    {votes.adventurers.toLocaleString()}
                  </div>
                </div>
              </button>

              {/* Card 3: Team Pets */}
              <button 
                onClick={() => handleVote('pets')}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-red-900/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-500/20 text-white/70 group-hover:text-red-400 transition-colors">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold tracking-widest text-neutral-400 group-hover:text-white mb-1">TEAM</span>
                    <span className="block text-sm font-bold text-white">MASCOTAS</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:from-red-400 group-hover:to-red-600">
                    {votes.pets.toLocaleString()}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Features Grid
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {[
              { title: 'Equipos Pro', desc: 'Cámaras, lenses y accesorios premium' },
              { title: 'Alquiler Flex', desc: 'Acceso al mejor equipo sin comprar' },
              { title: 'Comunidad', desc: 'Conecta con creadores locales' }
            ].map((feature, i) => (
              <div key={i} className="group p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                <h3 className="text-white font-bold text-xs sm:text-sm mb-1 group-hover:text-red-400 transition-colors">{feature.title}</h3>
                <p className="text-neutral-500 text-[10px] sm:text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full py-4 sm:py-6 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm mt-auto">
        <p className="text-center text-[9px] sm:text-[10px] text-neutral-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] px-4">
          © {new Date().getFullYear()} POV Store • Potenciando la Visión de Creadores
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-breath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.5; }
        }
        
        @keyframes float-particle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-pulse-breath { animation: pulse-breath 4s ease-in-out infinite; }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </main>
  );
}

function TimeUnit({ value, label, icon, isPrimary = false, isAnimated = false }: { 
  value: number; 
  label: string; 
  icon?: React.ReactNode;
  isPrimary?: boolean;
  isAnimated?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center group">
      <div className="relative">
        {isPrimary && (
          <div className="absolute -inset-1 sm:-inset-2 bg-red-500/20 rounded-xl sm:rounded-2xl blur-xl group-hover:bg-red-500/30 transition-all" />
        )}
        <div className={`relative px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${
          isPrimary 
            ? 'bg-gradient-to-b from-red-500/10 to-red-600/5 border border-red-500/20' 
            : 'bg-white/5 group-hover:bg-white/10'
        }`}>
          <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono font-bold tracking-tighter tabular-nums transition-all duration-300 ${
            isPrimary 
              ? 'text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600' 
              : isAnimated
              ? 'text-white group-hover:text-red-400'
              : 'text-white group-hover:text-red-300'
          } ${isAnimated ? 'animate-pulse' : ''}`}>
            {String(value).padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 md:mt-3">
        {icon && <div className="text-red-500/70">{icon}</div>}
        <span className="text-[8px] sm:text-[10px] md:text-xs text-neutral-400 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LÓGICA DE CUENTA REGRESIVA ---
  useEffect(() => {
    const targetDate = new Date('2026-01-30T00:00:00-03:00').getTime(); // Hora Uruguay

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        // Opcional: Redirigir a /homepage cuando llegue la fecha
        // window.location.href = '/homepage'; 
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- LÓGICA DE AUDIO (Latidos) ---
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioEnabled) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {}); // Ignorar error de autoplay browser policy
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center text-center selection:bg-red-600/50">
      
      {/* --- AUDIO OCULTO (Latido Profundo) --- */}
      {/* Descarga un "deep heartbeat sound" y ponlo en public/sounds/heartbeat.mp3 */}
      <audio ref={audioRef} src="/sounds/heartbeat.mp3" loop hidden />

      {/* --- FONDO VISCERAL --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ruido de película antigua */}
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        
        {/* Luz Roja Sangrante (Palpita con CSS) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-red-700/20 rounded-full blur-[180px] animate-pulse-heartbeat-bg" />
        
        {/* Viñeta oscura dramática */}
        <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,_black_90%)]" />
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="relative z-20 px-6 space-y-16 max-w-6xl mx-auto flex flex-col items-center">
        
        {/* --- EL CORAZÓN DE LA MARCA (Logo Animado) --- */}
        <div className="relative group">
           {/* Glow detrás del logo */}
           <div className="absolute -inset-4 bg-red-600/30 rounded-full blur-2xl animate-pulse-heartbeat opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
           
           {/* Logo Real */}
           <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 animate-pulse-heartbeat filter drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]">
             {/* REEMPLAZA '/images/logo-pov-black-red.png' CON LA RUTA REAL DE TU LOGO */}
             <Image 
                src="/images/logo-pov.png" 
                alt="POV Store Uruguay Logo" 
                fill
                className="object-contain"
                priority
             />
           </div>
        </div>

        {/* TITULARES DE IMPACTO */}
        <div className="space-y-4 uppercase tracking-tighter">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 animate-glitch-subtle">
            Montevideo, Uruguay
          </h2>
          <h1 className="text-7xl sm:text-8xl md:text-[10rem] font-black text-white leading-[0.85] scale-y-110 drop-shadow-2xl">
            ESTAMOS<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800">
              LLEGANDO
            </span>
          </h1>
        </div>

        {/* CUENTA REGRESIVA MONUMENTAL */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6 md:gap-10 w-full max-w-4xl border-t border-b border-red-900/30 py-8">
          <TimeBox value={timeLeft.days} label="DÍAS" />
          <TimeBox value={timeLeft.hours} label="HS" />
          <TimeBox value={timeLeft.minutes} label="MIN" />
          <TimeBox value={timeLeft.seconds} label="SEG" isRed />
        </div>

        {/* BOTÓN DE AUDIO + REDES */}
        <div className="flex flex-col items-center gap-8 pt-8">
            {/* Botón para activar la experiencia sonora */}
            <button 
                onClick={toggleAudio}
                className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-500 group ${isAudioEnabled ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-white'}`}
            >
                <Icon name={isAudioEnabled ? 'SpeakerWaveIcon' : 'SpeakerXMarkIcon'} size={20} className={isAudioEnabled ? 'animate-pulse' : ''} />
                <span className="text-sm font-bold tracking-widest uppercase">
                    {isAudioEnabled ? 'Adrenalina Activada' : 'Activar Sonido'}
                </span>
            </button>

            {/* Redes Sociales */}
            <div className="flex gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                <SocialLink href="https://instagram.com/povstoreuruguay" icon="CameraIcon" />
                <SocialLink href="https://facebook.com/povstoreuruguay" icon="UserGroupIcon" />
                <SocialLink href="https://youtube.com/@povstoreuruguay" icon="PlayIcon" />
            </div>
        </div>
      </div>
    </main>
  );
}

// --- Componentes & Estilos ---

function TimeBox({ value, label, isRed = false }: { value: number; label: string; isRed?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {/* Los segundos tienen un efecto de "glitch" rojo */}
      <div className={`text-5xl sm:text-7xl md:text-8xl font-black font-mono tabular-nums leading-none ${isRed ? 'text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse-fast' : 'text-white'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs sm:text-sm md:text-base text-red-700 font-bold tracking-[0.3em] mt-3 uppercase">{label}</span>
    </div>
  );
}

function SocialLink({ href, icon }: { href: string; icon: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="text-neutral-400 hover:text-red-500 transition-colors duration-300 hover:scale-110 transform"
    >
      <Icon name={icon as any} size={28} />
    </Link>
  );
}
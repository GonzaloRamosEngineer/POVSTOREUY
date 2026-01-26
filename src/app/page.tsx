'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // FECHA OBJETIVO: 30 Enero 2026
    const targetDate = new Date('2026-01-30T00:00:00-03:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
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

  if (!mounted) return null; // Evita flash de hidratación

  return (
    <main className="relative min-h-[100dvh] w-full bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center selection:bg-red-600 selection:text-white">
      
      {/* --- FONDO ATMOSFÉRICO (Tech Noir) --- */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Gradiente Radial Sutil (Luz de estudio) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#050505] to-[#050505]" />
        
        {/* Ruido Granulado (Textura de cine) */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        
        {/* El Corazón Rojo (Luz de fondo) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-red-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center gap-12 sm:gap-16">
        
        {/* 1. LOGO & UBICACIÓN */}
        <div className="flex flex-col items-center gap-6 animate-fade-in-up">
          <div className="relative group">
            {/* Efecto de respiración detrás del logo */}
            <div className="absolute -inset-6 bg-red-600/20 rounded-full blur-xl animate-pulse-heartbeat opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
            
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 animate-pulse-heartbeat">
              <Image 
                src="/images/logo-pov.png" // Asegúrate de que este nombre sea correcto en public/images/
                alt="POV Store Logo" 
                fill
                className="object-contain drop-shadow-2xl"
                priority
                unoptimized
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-red-500/80 tracking-[0.2em] text-xs sm:text-sm font-bold uppercase border border-red-900/30 px-4 py-1.5 rounded-full bg-red-950/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Montevideo, Uruguay
          </div>
        </div>

        {/* 2. TITULAR MONUMENTAL */}
        <div className="text-center space-y-2 sm:space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-neutral-400 tracking-widest uppercase">
            La revolución visual
          </h2>
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">
            IS COMING
          </h1>
        </div>

        {/* 3. TIMER DE ALTA PRECISIÓN */}
        <div className="w-full max-w-4xl border-y border-white/10 py-8 sm:py-12 bg-white/5 backdrop-blur-sm rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-4 gap-2 sm:gap-8 divide-x divide-white/10">
            <TimeUnit value={timeLeft.days} label="Días" />
            <TimeUnit value={timeLeft.hours} label="Horas" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Segs" isLast />
          </div>
        </div>

        {/* 4. CALL TO ACTION (Solo Instagram) */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link 
            href="https://www.instagram.com/povstore.uy/"
            target="_blank"
            className="group flex items-center gap-4 px-8 py-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]"
          >
            <Icon name="CameraIcon" size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-wide text-sm sm:text-base">SÍGUENOS EN INSTAGRAM</span>
            <Icon name="ArrowRightIcon" size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-neutral-500 text-xs text-center mt-4 tracking-wide">
            Sé el primero en saberlo.
          </p>
        </div>

      </div>

      {/* Footer Sutil */}
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
          © {new Date().getFullYear()} POV Store • Potenciando Creadores
        </p>
      </div>
    </main>
  );
}

// --- Componente de Unidad de Tiempo ---
function TimeUnit({ value, label, isLast = false }: { value: number; label: string; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center group">
      <div className={`text-4xl sm:text-6xl md:text-7xl font-mono font-light tracking-tighter tabular-nums transition-colors duration-300 ${isLast ? 'text-red-500' : 'text-white group-hover:text-red-200'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-[0.2em] mt-2 group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
  );
}
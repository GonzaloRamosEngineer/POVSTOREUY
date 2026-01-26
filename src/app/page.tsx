'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // FECHA OBJETIVO: 30 de Enero de 2026
    const targetDate = new Date('2026-01-30T00:00:00').getTime();

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

  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center text-center selection:bg-red-500/30">
      
      {/* --- FONDO CINEMÁTICO --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradiente sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black" />
        {/* Luz Roja Ambiental */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[150px] animate-pulse-subtle" />
        {/* Ruido de fondo (Textura) */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      </div>

      {/* --- CONTENIDO --- */}
      <div className="relative z-10 px-4 space-y-12 max-w-5xl mx-auto">
        
        {/* LOGO SIMPLIFICADO */}
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-red-600 text-white flex items-center justify-center rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.4)]">
              <Icon name="VideoCameraIcon" size={32} variant="solid" />
           </div>
        </div>

        {/* TITULARES DE IMPACTO */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
            POV IS COMING
          </h1>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-light text-red-500 tracking-[0.2em] uppercase animate-pulse">
            Estamos Llegando
          </h2>
        </div>

        {/* CUENTA REGRESIVA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-8">
          <TimeBox value={timeLeft.days} label="DÍAS" />
          <TimeBox value={timeLeft.hours} label="HORAS" />
          <TimeBox value={timeLeft.minutes} label="MINS" />
          <TimeBox value={timeLeft.seconds} label="SEGS" isRed />
        </div>

        {/* REDES SOCIALES (Para mantenerlos enganchados) */}
        <div className="pt-12 space-y-4">
          <p className="text-neutral-500 text-sm uppercase tracking-widest">Síguenos para novedades</p>
          <div className="flex justify-center gap-6">
            <SocialLink href="https://instagram.com/povstoreuruguay" icon="CameraIcon" />
            <SocialLink href="https://facebook.com/povstoreuruguay" icon="UserGroupIcon" />
            <SocialLink href="https://youtube.com/@povstoreuruguay" icon="PlayIcon" />
          </div>
        </div>

      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 text-neutral-600 text-xs">
        © 2026 POV Store Uruguay
      </div>
    </main>
  );
}

// --- Componentes Pequeños para Diseño ---

function TimeBox({ value, label, isRed = false }: { value: number; label: string; isRed?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-4xl sm:text-6xl md:text-7xl font-bold font-mono ${isRed ? 'text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-white'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs sm:text-sm text-neutral-500 font-bold tracking-widest mt-2">{label}</span>
    </div>
  );
}

function SocialLink({ href, icon }: { href: string; icon: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all duration-300 group"
    >
      <Icon name={icon as any} size={20} className="group-hover:scale-110 transition-transform" />
    </Link>
  );
}
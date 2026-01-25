'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Loader2, ScanFace, CheckCircle2, Lock, Zap } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'checking' | 'success' | 'error';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLoginInteractive() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // --- EFECTO 3D ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-5deg', '5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  };

  // Si ya está logueado y es admin → directo al dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        router.replace('/admin-dashboard');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg('');
    setStatus('checking');

    if (!email || !isEmail(email)) {
      setStatus('error');
      setErrorMsg('Ingresá un email válido.');
      return;
    }
    if (!password || password.length < 6) {
      setStatus('error');
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !signInData?.user) {
      setStatus('error');
      setErrorMsg('Credenciales inválidas o usuario no confirmado.');
      setPassword('');
      setTimeout(() => setStatus('idle'), 700);
      return;
    }

    const userId = signInData.user.id;

    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (pErr || !profile) {
      await supabase.auth.signOut();
      setStatus('error');
      setErrorMsg('No se pudo validar tu perfil. Revisá RLS/trigger de user_profiles.');
      setTimeout(() => setStatus('idle'), 900);
      return;
    }

    if (profile.role !== 'admin') {
      await supabase.auth.signOut();
      setStatus('error');
      setErrorMsg('Tu usuario está autenticado, pero no tiene rol admin.');
      setTimeout(() => setStatus('idle'), 900);
      return;
    }

    setStatus('success');
    if (navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => {
      router.replace('/admin-dashboard');
    }, 700);
  };

  const disabled = status === 'checking' || status === 'success';

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden perspective-1000"
      onMouseMove={handleMouseMove}
    >
      {/* Fondo tech */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted))_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      {/* Glow */}
      <motion.div
        style={{ x: mouseX, y: mouseY }}
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-200/20 to-violet-200/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
      />

      {/* Card 3D */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-border p-10 relative overflow-hidden">
          {/* scan light */}
          <motion.div
            initial={{ top: '-120%' }}
            animate={status === 'checking' || status === 'success' ? { top: '220%' } : { top: '-120%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-primary/15 to-transparent z-0 pointer-events-none"
          />

          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-background rounded-2xl shadow-sm mb-6 border border-border p-4">
                {status === 'success' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="text-green-500 w-10 h-10" />
                  </motion.div>
                ) : status === 'checking' ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <ScanFace className="text-primary w-10 h-10" />
                  </motion.div>
                ) : (
                  <Lock className="text-muted-foreground w-10 h-10" />
                )}
              </div>

              <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">POV Store</h1>
              <p className="text-muted-foreground text-xs mt-2 font-bold uppercase tracking-[0.2em]">
                Admin Access
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disabled}
                  className={cx(
                    'w-full px-4 py-3 bg-background border-2 rounded-xl text-center text-sm focus:ring-0 focus:border-primary transition-all outline-none',
                    status === 'error' ? 'border-red-300' : 'border-border'
                  )}
                  placeholder="admin@povstore.uy"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2 relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={disabled}
                  className={cx(
                    'w-full px-4 py-3 bg-background border-2 rounded-xl text-center text-lg tracking-[0.35em] focus:ring-0 focus:border-primary transition-all outline-none placeholder:tracking-normal',
                    status === 'error' ? 'border-red-300 bg-red-50/40' : 'border-border'
                  )}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                {status === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs text-center mt-2 font-medium"
                  >
                    {errorMsg || 'No se pudo iniciar sesión.'}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={disabled || !email || !password}
                className={cx(
                  'w-full h-12 rounded-xl text-sm font-bold tracking-wider transition-all duration-500 shadow-xl',
                  status === 'success'
                    ? 'bg-green-600 hover:bg-green-700 scale-[1.02] text-white'
                    : 'bg-foreground text-background hover:scale-[1.01]',
                  (disabled || !email || !password) && 'opacity-70 cursor-not-allowed'
                )}
              >
                {status === 'checking' ? (
                  <span className="flex items-center justify-center gap-2">
                    VERIFICANDO <Loader2 className="animate-spin" size={16} />
                  </span>
                ) : status === 'success' ? (
                  <span className="flex items-center justify-center gap-2">
                    AUTORIZADO <Lock size={16} />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    INGRESAR <ArrowRight size={16} />
                  </span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-semibold"
                >
                  Cancelar y volver
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Firma */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-8 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Engineered by</span>

        <a
          href="https://www.digitalmatchglobal.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative px-5 py-2 rounded-full bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-1 bg-muted rounded-full group-hover:bg-background transition-colors">
            <Zap size={12} className="text-muted-foreground group-hover:text-primary transition-all" />
          </div>

          <span className="relative text-xs font-bold text-muted-foreground group-hover:text-foreground transition-all">
            DIGITAL MATCH GLOBAL
          </span>
        </a>
      </motion.div>
    </div>
  );
}

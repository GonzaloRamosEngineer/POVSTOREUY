'use client';

const MarqueeBanner = () => {
  return (
    /* CAMBIO: Fondo Primary (Rojo) y texto blanco para máxima alerta */
    <div className="relative w-full bg-primary overflow-hidden py-2.5 shadow-neon-glow">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Bloque 1 */}
        <div className="flex items-center gap-12 px-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              ÚLTIMAS UNIDADES EN URUGUAY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              ENVÍO GRATIS A TODO EL PAÍS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              POV 4K HANDS-FREE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              12 CUOTAS SIN RECARGO
            </span>
          </div>
        </div>

        {/* Bloque 2 (Duplicado para el loop infinito) */}
        <div className="flex items-center gap-12 px-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              ÚLTIMAS UNIDADES EN URUGUAY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              ENVÍO GRATIS A TODO EL PAÍS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              POV 4K HANDS-FREE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              12 CUOTAS SIN RECARGO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarqueeBanner;
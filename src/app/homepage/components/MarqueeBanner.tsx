'use client';



const MarqueeBanner = () => {
  return (
    <div className="relative w-full bg-gradient-to-r from-neon-lime via-neon-orange to-neon-lime overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap">
        <div className="flex items-center gap-8 px-8">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-gray-900">ÚLTIMAS UNIDADES EN URUGUAY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚚</span>
            <span className="text-sm font-bold text-gray-900">Entrega estimada 19/01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-gray-900">POV 4K hands-free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-bold text-gray-900">MercadoPago</span>
          </div>
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex items-center gap-8 px-8">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-gray-900">ÚLTIMAS UNIDADES EN URUGUAY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚚</span>
            <span className="text-sm font-bold text-gray-900">Entrega estimada 19/01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-gray-900">POV 4K hands-free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-bold text-gray-900">MercadoPago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarqueeBanner;
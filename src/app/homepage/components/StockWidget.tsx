'use client';

import Icon from '@/components/ui/AppIcon';

interface StockWidgetProps {
  basicStock: number;
  proStock: number;
}

const StockWidget = ({ basicStock, proStock }: StockWidgetProps) => {
  return (
    // TECH NOIR: Fondo oscuro translúcido con borde rojo brillante
    <div className="bg-black/60 backdrop-blur-md border border-red-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(220,38,38,0.15)] relative overflow-hidden">
      {/* Glow rojo interno sutil */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-5">
        <Icon name="ExclamationTriangleIcon" size={24} className="text-red-500 animate-pulse" variant="solid" />
        <h3 className="text-lg font-bold text-white tracking-wide">Stock Limitado</h3>
      </div>
      
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-400 w-16">SJCAM C100 PLUS:</span>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${(basicStock / 10) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-red-500 w-6 text-right">{basicStock}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-400 w-16">SJCAM C200:</span>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${(proStock / 10) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-red-500 w-6 text-right">{proStock}</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-neutral-500 mt-5 text-center flex items-center justify-center gap-1.5">
        <span className="text-yellow-500">⚡</span> Se agotan rápido - No te quedes sin el tuyo
      </p>
    </div>
  );
};

export default StockWidget;
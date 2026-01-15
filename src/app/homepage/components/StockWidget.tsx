'use client';

import Icon from '@/components/ui/AppIcon';

interface StockWidgetProps {
  basicStock: number;
  proStock: number;
}

const StockWidget = ({ basicStock, proStock }: StockWidgetProps) => {
  return (
    <div className="bg-gray-900/80 backdrop-blur-md border-2 border-neon-orange rounded-xl p-6 shadow-neon-glow">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="ExclamationTriangleIcon" size={24} className="text-neon-orange" variant="solid" />
        <h3 className="text-lg font-bold text-white">Stock Limitado</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Básico:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neon-orange to-red-500 transition-all"
                style={{ width: `${(basicStock / 10) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-neon-orange">{basicStock}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Pro:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neon-orange to-red-500 transition-all"
                style={{ width: `${(proStock / 10) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-neon-orange">{proStock}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center animate-pulse-subtle">
        ⚡ Se agotan rápido - No te quedes sin el tuyo
      </p>
    </div>
  );
};

export default StockWidget;
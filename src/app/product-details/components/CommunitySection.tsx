'use client';

import Icon from '@/components/ui/AppIcon';

const categories = [
  { id: 'moto', label: 'Motorvlog', icon: 'FireIcon', image: '/images/community-moto.jpg' },
  { id: 'water', label: 'Acuático', icon: 'SparklesIcon', image: '/images/community-water.jpg' }, // Sparkles como "gotas" o diversión
  { id: 'trek', label: 'Senderos', icon: 'MapIcon', image: '/images/community-hike.jpg' },
  { id: 'pets', label: 'Mascotas', icon: 'HeartIcon', image: '/images/community-pet.jpg' },
];

export default function CommunitySection() {
  return (
    <section className="py-24 bg-neutral-950 border-t border-neutral-900 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
        <span className="text-red-500 font-bold tracking-widest text-sm uppercase mb-4 block animate-pulse">
          #POVStoreUruguay
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Unite a la Comunidad
        </h2>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-16">
          Compartí tu aventura. Desde las rutas nacionales hasta bajo el agua. 
          Esta es la comunidad de creadores POV de Uruguay.
        </p>

        {/* Grid de Categorías "Próximamente" */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-not-allowed">
              {/* Overlay "Próximamente" */}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 group-hover:bg-black/80 transition-colors">
                <Icon name="LockClosedIcon" size={32} className="text-neutral-500 mb-2" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide border border-neutral-600 px-2 py-1 rounded">
                  Próximamente
                </span>
              </div>
              
              {/* Icono y Texto de fondo */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-10 opacity-50">
                <Icon name={cat.icon as any} size={40} className="text-white mb-2" />
                <span className="text-lg font-bold text-white">{cat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Subir mi Video (Pronto)
          </button>
        </div>
      </div>
    </section>
  );
}
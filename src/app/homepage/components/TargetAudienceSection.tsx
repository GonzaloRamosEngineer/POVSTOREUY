import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface AudienceCard {
  title: string;
  description: string;
  image: string;
  alt: string;
  tags: string[];
  icon: string;
}

const TargetAudienceSection = () => {
  const audienceData: AudienceCard[] = [
    {
      title: 'Creadores',
      description: 'Dale a tus vlogs el ángulo POV auténtico que atrapa a la audiencia.',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1cbf2955b-1764705968076.png",
      alt: 'Content creator filming POV',
      tags: ['TikTok Ready', '4K', 'Manos Libres'],
      icon: 'VideoCameraIcon'
    },
    {
      title: 'Aventureros',
      description: 'Desde la cima de la montaña hasta el fondo del mar. Resistencia total.',
      image: "https://images.unsplash.com/photo-1499749463928-0ea25b91e19a",
      alt: 'Mountain biker POV',
      tags: ['IPX4/IP68', 'Estabilización', 'Robusta'],
      icon: 'BoltIcon'
    },
    {
      title: 'Viajeros',
      description: 'Captura la esencia de tus viajes sin cargar equipos pesados.',
      image: "https://images.unsplash.com/photo-1443689959074-a047eeb9cc43",
      alt: 'Travel blogger exploring',
      tags: ['Ultraligera', 'Discreta', 'Batería Larga'],
      icon: 'GlobeAmericasIcon'
    },
    {
      title: 'Profesionales',
      description: 'Herramienta clave para mostrar procesos, tutoriales y reviews.',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1666b152c-1767844909390.png",
      alt: 'Entrepreneur recording',
      tags: ['Alta Calidad', 'Fácil Uso', 'Versátil'],
      icon: 'BriefcaseIcon'
    }
  ];

  return (
    // CAMBIO 1: Fondo oscuro profundo (neutral-950) en lugar de blanco
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo sutiles (opcional, para profundidad) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
         <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER OSCURO */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            {/* CAMBIO 2: Texto blanco para el título */}
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight leading-tight mb-4">
              Diseñada para <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Tu Estilo de Vida.
              </span>
            </h2>
            {/* CAMBIO 3: Texto gris claro para el subtítulo */}
            <p className="text-lg text-neutral-400">
              No importa qué historia quieras contar, tenemos la herramienta para capturarla.
            </p>
          </div>
          
          <div className="hidden md:block">
            <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-500 hover:text-red-500 transition-colors group">
              Explorar Usos
              <Icon name="ArrowRightIcon" size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* GRID "BENTO" STYLE (Las tarjetas ya eran oscuras por dentro, no necesitan cambios) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-auto md:h-[500px]">
          {audienceData.map((item, index) => {
            return (
              <div
                key={index}
                // Agregamos un borde muy sutil oscuro para definir las tarjetas en el fondo negro
                className="group relative h-[400px] md:h-full rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-red-900/20 transition-all duration-500 border border-neutral-900/50"
              >
                {/* IMAGEN DE FONDO */}
                <div className="absolute inset-0 w-full h-full">
                  <AppImage
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  {/* Overlay Gradiente Pro (Negro abajo -> Transparente arriba) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-90 transition-opacity" />
                </div>

                {/* CONTENIDO FLOTANTE (Texto blanco sobre fondo oscuro) */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-white">
                  
                  {/* Icono flotante superior */}
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-red-600 group-hover:border-red-600 transition-colors duration-300">
                    <Icon name={item.icon as any} size={20} className="text-white" />
                  </div>

                  {/* Textos */}
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 w-full">
                    <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-red-500 transition-colors">{item.title}</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tags / Benefits (Glassmorphism) */}
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-200 group-hover:bg-red-600/20 group-hover:border-red-500/30 group-hover:text-white transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
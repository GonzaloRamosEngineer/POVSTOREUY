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
      title: 'MASCOTAS POV',
      description: 'Videos divertidos y ángulos únicos sin que tu mascota note que lleva la cámara.',
      image: "https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/audience-pets.png", 
      alt: 'Mascota usando cámara POV',
      tags: ['VIDEOS DIVERTIDOS', 'ULTRA LIVIANA', 'ÁNGULOS ÚNICOS'],
      icon: 'PawIcon' // Referencia a "patas/suave"
    },
    {
      title: 'DÍA A DÍA',
      description: 'Grabación manos libres para registrar tus recorridos diarios con total claridad y facilidad.',
      image: "https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/audience-urban.png",
      alt: 'Seguridad vial y traslados diarios',
      tags: ['TESTIGO EN RUTA', 'MANOS LIBRES', 'SEGURIDAD VIAL'],
      icon: 'ShieldCheckIcon'
    },
    {
      title: 'AVENTURA & DEPORTE',
      description: 'Capturá la acción de tus entrenamientos con la estabilidad y detalle que tus rutas merecen.',
      image: "https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/audience-sport.png",
      alt: 'Deporte y aire libre 4K',
      tags: ['CALIDAD 4K', 'RESISTENTE', 'CAPTURÁ LA ACCIÓN'],
      icon: 'BikeIcon'
    },
    {
      title: 'SUMERGIBLE & ACUÁTICA',
      description: 'Videos nítidos y audio auténtico en tus aventuras acuáticas más extremas.',
      image: "https://kdzhyalorvjqxhybtdil.supabase.co/storage/v1/object/public/media/audience-water.png",
      alt: 'Cámara bajo el agua',
      tags: ['HASTA 5M SIN CARCASA', 'AUDIO BAJO EL AGUA', 'VIDEOS NÍTIDOS'],
      icon: 'WaterDropIcon'
    }
  ];

  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden">
      
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
         <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight leading-tight mb-4">
              Diseñada para <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Tu Estilo de Vida.
              </span>
            </h2>
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

        {/* GRID BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {audienceData.map((item, index) => (
            <div
              key={index}
              className="group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-red-900/20 transition-all duration-500 border border-neutral-900/50"
            >
              {/* IMAGEN DE FONDO */}
              <div className="absolute inset-0 w-full h-full">
                <AppImage
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
              </div>

              {/* CONTENIDO */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-white">
                
                {/* Icono flotante */}
                <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-red-600 group-hover:border-red-600 transition-colors duration-300">
                  <Icon name={item.icon as any} size={20} className="text-white" />
                </div>

                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full">
                  <h3 className="text-2xl font-black mb-2 text-white group-hover:text-red-500 transition-colors leading-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-neutral-300 text-sm leading-snug mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-3">
                    {item.description}
                  </p>

                  {/* Tags Glassmorphism */}
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded text-[9px] font-black tracking-wider text-neutral-300 group-hover:border-red-500/30 transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
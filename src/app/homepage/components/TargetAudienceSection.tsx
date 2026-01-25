import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface AudienceCard {
  title: string;
  description: string;
  image: string;
  alt: string;
  benefits: string[];
  icon: string;
}

const TargetAudienceSection = () => {
  const audienceData: AudienceCard[] = [
    {
      title: 'Creadores de Contenido',
      description: 'YouTubers, TikTokers e influencers que necesitan capturar momentos auténticos desde su perspectiva',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1cbf2955b-1764705968076.png",
      alt: 'Young content creator filming video with camera in modern studio setup with ring light',
      benefits: ['POV auténtico', 'Manos libres', 'Calidad 4K'],
      icon: 'VideoCameraIcon'
    },
    {
      title: 'Deportistas y Aventureros',
      description: 'Captura tus aventuras extremas, deportes y actividades al aire libre con total libertad',
      image: "https://images.unsplash.com/photo-1499749463928-0ea25b91e19a",
      alt: 'Athletic person mountain biking on rugged trail with action camera mounted on helmet',
      benefits: ['Resistente', 'Compacta', 'Estabilización'],
      icon: 'BoltIcon'
    },
    {
      title: 'Viajeros y Bloggers',
      description: 'Documenta tus viajes y experiencias sin cargar equipos pesados o costosos',
      image: "https://images.unsplash.com/photo-1443689959074-a047eeb9cc43",
      alt: 'Female travel blogger exploring ancient temple ruins with backpack and camera gear',
      benefits: ['Ligera', 'Portátil', 'Larga batería'],
      icon: 'GlobeAmericasIcon'
    },
    {
      title: 'Emprendedores',
      description: 'Crea contenido profesional para tu negocio sin invertir en equipos caros',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1666b152c-1767844909390.png",
      alt: 'Young entrepreneur recording product review video in home office with professional lighting',
      benefits: ['Económica', 'Profesional', 'Fácil de usar'],
      icon: 'BriefcaseIcon'
    }
  ];

  return (
    <section className="py-24 px-4 bg-neutral-950 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Diseñada para <span className="text-red-600">Creadores como Vos</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Sea cual sea tu pasión, nuestra cámara POV se adapta a tu estilo de vida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audienceData.map((audience, index) =>
            <div
              key={index}
              className="bg-black rounded-2xl overflow-hidden border border-neutral-800 hover:border-red-900/50 shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] transition-all duration-300 group"
            >
              <div className="relative h-72 overflow-hidden">
                <AppImage
                  src={audience.image}
                  alt={audience.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                
                <div className="absolute bottom-6 left-6 flex items-end gap-4">
                  <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300">
                    <Icon name={audience.icon as any} size={28} className="text-white" variant="solid" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white mb-1 group-hover:text-red-500 transition-colors">
                    {audience.title}
                  </h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <p className="text-neutral-400 text-lg leading-relaxed border-l-2 border-red-900/30 pl-4 group-hover:border-red-600 transition-colors">
                  {audience.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {audience.benefits.map((benefit, idx) =>
                    <span
                      key={idx}
                      className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-medium rounded-full group-hover:border-red-900/50 group-hover:text-white transition-colors"
                    >
                      {benefit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
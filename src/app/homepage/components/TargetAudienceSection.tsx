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
  }];


  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Diseñada para Creadores como Vos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sea cual sea tu pasión, nuestra cámara POV se adapta a tu estilo de vida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audienceData.map((audience, index) =>
          <div
            key={index}
            className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-smooth group">

              <div className="relative h-64 overflow-hidden">
                <AppImage
                src={audience.image}
                alt={audience.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />

                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Icon name={audience.icon as any} size={24} className="text-primary-foreground" variant="solid" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {audience.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-muted-foreground">{audience.description}</p>

                <div className="flex flex-wrap gap-2">
                  {audience.benefits.map((benefit, idx) =>
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">

                      {benefit}
                    </span>
                )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

};

export default TargetAudienceSection;
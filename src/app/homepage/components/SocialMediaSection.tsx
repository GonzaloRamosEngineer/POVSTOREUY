import Icon from '@/components/ui/AppIcon';

interface SocialLink {
  name: string;
  icon: string;
  url: string;
  followers: string;
  color: string;
}

const SocialMediaSection = () => {
  const socialLinks: SocialLink[] = [
    {
      name: 'Instagram',
      icon: 'CameraIcon',
      url: 'https://instagram.com/povstoreuruguay',
      followers: '12.5K',
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'TikTok',
      icon: 'MusicalNoteIcon',
      url: 'https://tiktok.com/@povstoreuruguay',
      followers: '8.3K',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      name: 'YouTube',
      icon: 'PlayIcon',
      url: 'https://youtube.com/@povstoreuruguay',
      followers: '5.2K',
      color: 'from-red-500 to-red-600',
    },
    {
      name: 'Facebook',
      icon: 'UserGroupIcon',
      url: 'https://facebook.com/povstoreuruguay',
      followers: '9.1K',
      color: 'from-blue-600 to-blue-700',
    },
  ];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Seguinos en Redes Sociales
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unite a nuestra comunidad de creadores y descubrí contenido exclusivo, tutoriales y ofertas especiales
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card hover:bg-card-foreground/5 rounded-xl p-6 text-center transition-smooth shadow-md hover:shadow-xl focus-ring"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${social.color} rounded-full mb-4 group-hover:scale-110 transition-smooth`}>
                <Icon name={social.icon as any} size={28} className="text-white" variant="solid" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                {social.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{social.followers} seguidores</p>
              <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                <span>Seguir</span>
                <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-smooth" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Etiquetanos en tus videos con <span className="text-primary font-semibold">#POVStoreUruguay</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-muted rounded-full text-sm text-foreground">
              #POV4K
            </span>
            <span className="px-4 py-2 bg-muted rounded-full text-sm text-foreground">
              #CreadorUruguayo
            </span>
            <span className="px-4 py-2 bg-muted rounded-full text-sm text-foreground">
              #ContenidoCreativo
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;
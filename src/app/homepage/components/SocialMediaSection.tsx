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
      color: 'from-purple-600 to-pink-600', // Un poco más oscuro para Tech Noir
    },
    {
      name: 'TikTok',
      icon: 'MusicalNoteIcon',
      url: 'https://tiktok.com/@povstoreuruguay',
      followers: '8.3K',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      name: 'YouTube',
      icon: 'PlayIcon',
      url: 'https://youtube.com/@povstoreuruguay',
      followers: '5.2K',
      color: 'from-red-600 to-red-700', // Rojo intenso
    },
    {
      name: 'Facebook',
      icon: 'UserGroupIcon',
      url: 'https://facebook.com/povstoreuruguay',
      followers: '9.1K',
      color: 'from-blue-700 to-blue-800',
    },
  ];

  return (
    <section className="py-20 px-4 bg-black border-t border-neutral-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Seguinos en Redes Sociales
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
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
              className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-6 text-center transition-all shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${social.color} rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon name={social.icon as any} size={28} className="text-white" variant="solid" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white mb-1 group-hover:text-red-500 transition-colors">
                {social.name}
              </h3>
              <p className="text-sm text-neutral-500 mb-4 group-hover:text-neutral-400">{social.followers} seguidores</p>
              <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-medium opacity-80 group-hover:opacity-100">
                <span>Seguir</span>
                <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-neutral-500 mb-6">
            Etiquetanos en tus videos con <span className="text-red-500 font-semibold">#POVStoreUruguay</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-300 hover:border-red-500/50 hover:text-white transition-colors cursor-default">
              #POV4K
            </span>
            <span className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-300 hover:border-red-500/50 hover:text-white transition-colors cursor-default">
              #CreadorUruguayo
            </span>
            <span className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-300 hover:border-red-500/50 hover:text-white transition-colors cursor-default">
              #ContenidoCreativo
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;
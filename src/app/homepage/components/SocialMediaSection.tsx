import Icon from '@/components/ui/AppIcon';

interface SocialLink {
  name: string;
  icon: string;
  url?: string;
  isActive: boolean;
  color: string;
}

const SocialMediaSection = () => {
  const socialLinks: SocialLink[] = [
    {
      name: 'Instagram',
      icon: 'CameraIcon',
      url: 'https://www.instagram.com/povstore.uy/',
      isActive: true,
      color: 'from-purple-600 to-pink-600',
    },
    {
      name: 'TikTok',
      icon: 'MusicalNoteIcon',
      url: 'https://www.tiktok.com/@povstore.uy',
      isActive: true,
      color: 'from-cyan-600 to-blue-600',
    },
    {
      name: 'Facebook',
      icon: 'UserGroupIcon',
      isActive: false,
      color: 'from-blue-700 to-blue-800',
    },
    {
      name: 'Twitter',
      icon: 'ChatBubbleLeftRightIcon',
      isActive: false,
      color: 'from-sky-600 to-blue-600',
    },
  ];

  return (
    <section className="py-20 px-4 bg-black border-t border-neutral-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Seguinos en <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-600">redes sociales</span>
          </h2>
          <p className="text-lg text-neutral-400">
            Tutoriales, reviews y ofertas exclusivas
          </p>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
          {socialLinks.map((social, index) => (
            social.isActive ? (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 text-center transition-all"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${social.color} rounded-full mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon name={social.icon as any} size={20} className="text-white" variant="solid" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-red-500 transition-colors">
                  {social.name}
                </h3>
              </a>
            ) : (
              <div
                key={index}
                className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 text-center relative overflow-hidden"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-800 rounded-full mb-3 opacity-50">
                  <Icon name={social.icon as any} size={20} className="text-neutral-500" variant="solid" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-500 mb-1">
                  {social.name}
                </h3>
                <span className="text-xs text-neutral-600 uppercase tracking-wider">
                  Próximamente
                </span>
              </div>
            )
          ))}
        </div>

        {/* Hashtag */}
        <div className="text-center">
          <p className="text-neutral-500 mb-4">
            Etiquetanos con <span className="text-red-500 font-semibold">#POVStoreUruguay</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['#POV4K', '#ActionCamera', '#ContentCreator'].map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1.5 bg-neutral-900/30 border border-neutral-800 rounded-full text-xs text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default SocialMediaSection;
'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SocialShareCardProps {
  orderNumber: string;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({ orderNumber }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleCopyLink = () => {
    if (!isHydrated) return;

    const shareText = `¡Acabo de comprar mi cámara POV 4K en POV Store Uruguay! 🎥 Filma en 4K lo que ven tus ojos. Pedido #${orderNumber}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: 'ChatBubbleLeftRightIcon' as const,
      color: 'bg-[#25D366] hover:bg-[#20BA5A]',
      url: `https://wa.me/?text=${encodeURIComponent(`¡Acabo de comprar mi cámara POV 4K en POV Store Uruguay! 🎥 Pedido #${orderNumber}`)}`,
    },
    {
      name: 'Facebook',
      icon: 'ShareIcon' as const,
      color: 'bg-[#1877F2] hover:bg-[#166FE5]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://povstoreuruguay.com')}`,
    },
    {
      name: 'Twitter',
      icon: 'AtSymbolIcon' as const,
      color: 'bg-[#1DA1F2] hover:bg-[#1A94DA]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Acabo de comprar mi cámara POV 4K! 🎥 #POVStoreUruguay #4K`)}`,
    },
  ];

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
        <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
          Comparte tu Compra
        </h2>
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 space-y-6 card-elevation">
      <h2 className="text-xl font-heading font-semibold text-foreground pb-4 border-b border-border">
        Comparte tu Compra
      </h2>

      <p className="text-sm text-muted-foreground">
        ¡Comparte tu nueva cámara POV 4K con tus amigos y seguidores!
      </p>

      <div className="flex flex-wrap gap-3">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 ${social.color} text-white rounded-md transition-smooth focus-ring`}
            aria-label={`Compartir en ${social.name}`}
          >
            <Icon name={social.icon} size={18} className="text-white" />
            <span className="text-sm font-medium">{social.name}</span>
          </a>
        ))}

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-smooth focus-ring"
          aria-label="Copiar enlace"
        >
          <Icon
            name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'}
            size={18}
            className={copied ? 'text-success' : 'text-foreground'}
          />
          <span className="text-sm font-medium">
            {copied ? 'Copiado!' : 'Copiar'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SocialShareCard;
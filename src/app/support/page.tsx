import { Metadata } from 'next';
import SupportPageContent from './SupportPageContent';

// Metadatos para SEO y compartir en redes sociales
export const metadata: Metadata = {
  title: 'Soporte y Ayuda | POV Store Uruguay',
  description:
    'Centro de ayuda de POV Store Uruguay. Manuales, guías de configuración, preguntas frecuentes, información sobre envíos, garantía y soporte post-venta para cámaras SJCAM.',

  keywords:
    'soporte SJCAM, manual C100+, manual C200, garantía cámaras, soporte post venta, POV Store Uruguay',

  openGraph: {
    title: 'Soporte y Ayuda | POV Store Uruguay',
    description:
      'Todo lo que necesitás para usar tu cámara con tranquilidad: manuales, configuración, envíos, garantía del vendedor y soporte real post-venta.',
    url: 'https://povstore.uy/support',
    siteName: 'POV Store Uruguay',
    locale: 'es_UY',
    type: 'website',
    images: [
      {
        url: 'https://povstore.uy/images/og-support.png',
        width: 1200,
        height: 630,
        alt: 'Centro de Soporte y Ayuda POV Store Uruguay',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Soporte y Ayuda | POV Store Uruguay',
    description:
      'Manuales, guías y soporte post-venta para que aproveches tu cámara SJCAM desde el primer día.',
    images: ['/images/og-support.jpg'],
  },
};

export default function SupportPage() {
  return <SupportPageContent />;
}

import type { Metadata } from 'next';
import HomepageInteractive from './components/HomepageInteractive';

// 1. ESTO ES LO QUE ARREGLA EL CACHÉ DE VERCEL
// Obliga a que la página se regenere en cada visita, mostrando los datos reales.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'POV Store Uruguay - Cámaras 4K para Creadores de Contenido',
  description: 'Cámaras POV mini 4K profesionales a precios accesibles. Perfectas para YouTubers, TikTokers e influencers uruguayos. Envío gratis y despacho en 24hs.',
  openGraph: {
    title: 'POV Store Uruguay - Tu vida en primera persona',
    description: 'Cámaras de acción 4K, ultraligeras y magnéticas. El kit más completo de Uruguay para creadores de contenido.',
    url: 'https://povstore.uy', 
    siteName: 'POV Store Uruguay',
    images: [
      {
        url: 'https://povstore.uy/images/og-home.png', // Corregido
        width: 1200,
        height: 630,
        alt: 'POV Store Uruguay - Equipamiento para Creadores',
      },
    ],
    locale: 'es_UY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POV Store Uruguay',
    description: 'Cámaras POV profesionales a precios accesibles.',
    images: ['https://povstore.uy/images/og-home.png'], // Corregido
  },
};

export default function Homepage() {
  // Estos logs los verás en el panel de Vercel si hay problemas
  console.log("🚀 [Server] Renderizando Homepage...");
  
  return <HomepageInteractive />;
}
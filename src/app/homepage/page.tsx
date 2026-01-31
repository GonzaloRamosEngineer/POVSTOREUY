import type { Metadata } from 'next';
import HomepageInteractive from './components/HomepageInteractive';

// 1. ESTO ES LO QUE ARREGLA EL CACHÉ DE VERCEL
// Obliga a que la página se regenere en cada visita, mostrando los datos reales.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'POV Store Uruguay - Cámaras 4K para Creadores de Contenido',
  description: 'Cámaras POV mini 4K profesionales a precios accesibles. Perfectas para YouTubers, TikTokers e influencers uruguayos. Envío gratis y despacho en 24hs.',
};

export default function Homepage() {
  // Estos logs los verás en el panel de Vercel si hay problemas
  console.log("🚀 [Server] Renderizando Homepage...");
  
  return <HomepageInteractive />;
}
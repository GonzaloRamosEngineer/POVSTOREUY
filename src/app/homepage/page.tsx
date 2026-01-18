import type { Metadata } from 'next';
import HomepageInteractive from './components/HomepageInteractive';

export const metadata: Metadata = {
  title: 'POV Store Uruguay - Cámaras 4K para Creadores de Contenido',
  description: 'Cámaras POV mini 4K profesionales a precios accesibles. Perfectas para YouTubers, TikTokers e influencers uruguayos. Envío gratis y garantía 12 meses.',
};

export default function Homepage() {
  return <HomepageInteractive />;
}

import { Metadata } from 'next';
import SeguimientoContent from './SeguimientoContent';

export const metadata: Metadata = {
  title: 'Seguí tu pedido | POV Store Uruguay',
  description:
    'Consultá el estado de tu pedido en POV Store Uruguay con tu número de pedido y el email de la compra. Sin crear cuenta.',
  keywords: 'seguimiento pedido POV Store, estado de mi pedido, rastrear pedido Uruguay',
  openGraph: {
    title: 'Seguí tu pedido | POV Store Uruguay',
    description: 'Consultá el estado de tu pedido con tu número de pedido y el email de la compra.',
    url: 'https://povstore.uy/seguimiento',
    siteName: 'POV Store Uruguay',
    locale: 'es_UY',
    type: 'website',
  },
  // Es una utilidad para clientes, no una landing: no aporta a la indexación
  // y evita que Google liste una página de consulta de datos personales.
  robots: { index: false, follow: true },
};

export default function SeguimientoPage() {
  return <SeguimientoContent />;
}

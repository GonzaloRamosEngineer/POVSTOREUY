import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';

// -----------------------------------------------------------------------------
// 🔥 ESTA ES LA LÍNEA CLAVE QUE FALTABA:
// Obliga a Vercel a generar la página en cada visita (Server Side Rendering).
// Esto evita que se quede guardada una página de "Error 404" en la memoria caché.
export const dynamic = 'force-dynamic';
// -----------------------------------------------------------------------------

// Configuración de Supabase (Server Side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definimos el tipo de Params como una Promesa (Requisito de Next.js moderno)
type Props = {
  params: Promise<{ id: string }>;
};

// SEO Dinámico
export async function generateMetadata({ params }: Props) {
  // 1. Esperamos a obtener los parámetros
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', id)
    .single();

  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: `${product.name} - POV Store Uruguay`,
    description: product.description?.substring(0, 160) || 'Cámaras de acción profesionales.',
  };
}

export default async function ProductPage({ params }: Props) {
  // 1. Esperamos a obtener los parámetros aquí también
  const { id } = await params;

  // 2. Buscamos el producto en la DB usando el ID obtenido
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    notFound();
  }

  // 3. Preparamos la Galería
  const formattedGallery = [
    ...(product.video_url
      ? [{
          id: 'video-main',
          url: product.video_url,
          alt: `Video de ${product.name}`,
          type: 'video' as const,
        }]
      : []),
    {
      id: 'main-image',
      url: product.image_url,
      alt: `${product.name} principal`,
      type: 'image' as const,
    },
    ...(product.gallery || []).map((url: string, index: number) => ({
      id: `gallery-${index}`,
      url: url,
      alt: `${product.name} vista ${index + 1}`,
      type: 'image' as const,
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductDetailsInteractive 
        productInitial={product} 
        galleryInitial={formattedGallery} 
      />
    </div>
  );
}
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';

// --- CORRECCIÓN CRÍTICA PARA VERCEL ---
// Esto obliga a que la página se genere en el servidor en cada visita.
// Sin esto, Vercel intenta buscar una página estática que no existe (Error 404).
export const dynamic = 'force-dynamic';
// --------------------------------------

// Configuración de Supabase (Server Side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ id: string }>;
};

// SEO Dinámico
export async function generateMetadata({ params }: Props) {
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
  const { id } = await params;

  // --- LOGS DE DEPURACIÓN (Solo se verán en los logs de Vercel) ---
  console.log(`🚀 [Server] Solicitando producto ID: ${id}`);
  
  // Verificamos conexión básica
  if (!supabaseUrl || !supabaseKey) {
     console.error("❌ [Server] Faltan variables de entorno de Supabase en Vercel");
  }

  // 2. Buscamos el producto en la DB
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`❌ [Server] Error Supabase: ${error.message}`);
  }

  if (!product) {
    console.warn(`⚠️ [Server] Producto no encontrado o es null para ID: ${id}`);
    notFound(); // Esto dispara el 404 intencional si no hay producto
  } else {
    console.log(`✅ [Server] Producto encontrado: ${product.name}`);
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
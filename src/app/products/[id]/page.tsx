import { createClient } from '@supabase/supabase-js';
// import { notFound } from 'next/navigation'; // <--- COMENTADO PARA MODO DIAGNÓSTICO
import Header from '@/components/common/Header';
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';

// --- CONFIGURACIÓN DE RENDERIZADO ---
// Esto obliga a que la página se genere en el servidor en cada visita.
export const dynamic = 'force-dynamic';

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

  // 1. Buscamos el producto en la DB
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  // --- MODO DIAGNÓSTICO: EN LUGAR DE 404, MOSTRAMOS DATOS ---
  // Si hay error o el producto es null, renderizamos este panel
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white text-black p-10 font-mono">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ DIAGNÓSTICO DE ERROR</h1>
        <div className="space-y-4 border p-4 rounded bg-gray-50">
          <p><strong>ID Solicitado:</strong> {id}</p>
          
          <p><strong>Estado Supabase:</strong> {product ? 'Producto Encontrado' : 'Producto NULL'}</p>
          
          <div className="bg-gray-200 p-2 rounded">
            <strong>Error Detallado:</strong>
            <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(error, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-sm">
            <strong>Variables de Entorno (Server):</strong>
            <p>URL Definida: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SÍ ✅' : 'NO ❌'}</p>
            <p>Key Definida: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SÍ ✅' : 'NO ❌'}</p>
            <p className="mt-2 text-xs text-gray-500 break-all">
                Valor URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '(Vacío)'}
            </p> 
          </div>
        </div>
      </div>
    );
  }
  // -----------------------------------------------------------

  // 2. Si todo salió bien, Preparamos la Galería
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

  // 3. Renderizamos la UI normal
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
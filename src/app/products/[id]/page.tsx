import { createClient } from '@supabase/supabase-js';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';

// Forzar dinamismo para evitar caché
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Validar Variables antes de intentar nada
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return <ErrorScreen message="Faltan las variables de entorno NEXT_PUBLIC_... en Vercel" />;
  }

  // 2. Crear cliente
  const supabase = createClient(sbUrl, sbKey);

  // 3. Buscar producto
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  // --- DIAGNÓSTICO DE ERRORES (En lugar de notFound) ---
  if (error) {
    return (
      <ErrorScreen 
        message={`Error de Supabase: ${error.message}`} 
        details={JSON.stringify(error, null, 2)} 
      />
    );
  }

  if (!product) {
    return (
      <ErrorScreen 
        message="Producto no encontrado en la Base de Datos" 
        details={`ID Buscado: ${id} - La consulta no devolvió resultados.`} 
      />
    );
  }
  // -----------------------------------------------------

  // 4. Preparar Galería
  const formattedGallery = [
    ...(product.video_url
      ? [{ id: 'video-main', url: product.video_url, alt: `Video`, type: 'video' as const }]
      : []),
    { id: 'main-image', url: product.image_url, alt: product.name, type: 'image' as const },
    ...(product.gallery || []).map((url: string, index: number) => ({
      id: `gallery-${index}`, url, alt: `Vista ${index + 1}`, type: 'image' as const,
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

// Componente simple para mostrar errores en pantalla
function ErrorScreen({ message, details }: { message: string, details?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full border-l-4 border-red-500">
        <h1 className="text-xl font-bold text-red-600 mb-2">⚠️ Algo salió mal</h1>
        <p className="text-gray-800 font-medium">{message}</p>
        {details && (
          <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto font-mono text-gray-600">
            {details}
          </pre>
        )}
        <p className="mt-6 text-sm text-gray-400">Este mensaje es visible para depuración.</p>
      </div>
    </div>
  );
}
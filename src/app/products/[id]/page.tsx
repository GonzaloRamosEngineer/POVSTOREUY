import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';

// --- NUEVAS IMPORTACIONES ---
import ProductStickyNav from '@/app/product-details/components/ProductStickyNav';
import DynamicStoryRenderer from '@/app/product-details/components/DynamicStoryRenderer';
import TechSpecsTable from '@/app/product-details/components/TechSpecsTable';
import ProductComparison from '@/app/product-details/components/ProductComparison';
import ProductFAQ from '@/app/product-details/components/ProductFAQ'; // <--- NUEVO IMPORT
import { Product } from '@/types/product'; 
// -----------------------------

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ id: string }>;
};

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

  // Traemos todos los productos activos para la comparación
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error || !allProducts) {
    notFound();
  }

  const rawProduct = allProducts.find((p) => p.id === id);

  if (!rawProduct) {
    notFound();
  }

  // Casting de Tipos
  const product = rawProduct as unknown as Product;
  const productsList = allProducts as unknown as Product[];

  // Formateo de galería
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
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* 1. SECCIÓN DE COMPRA */}
      <ProductDetailsInteractive 
        productInitial={rawProduct} 
        galleryInitial={formattedGallery} 
      />

      {/* 2. BARRA DE NAVEGACIÓN PEGAJOSA */}
      <ProductStickyNav />

      {/* 3. HISTORIA VISUAL */}
      <div id="overview">
         <DynamicStoryRenderer content={product.story_content} />
      </div>

      {/* 4. ESPECIFICACIONES TÉCNICAS */}
      <div id="specs">
         <TechSpecsTable specs={product.tech_specs} />
      </div>

      {/* 5. TABLA COMPARATIVA */}
      <div id="compare">
        <ProductComparison currentProduct={product} allProducts={productsList} />
      </div>

      {/* 6. 🔥 NUEVO: PREGUNTAS FRECUENTES (FAQ) 🔥 */}
      <div id="faq">
        <ProductFAQ faqs={product.faq_content} />
      </div>

      {/* 7. RESEÑAS */}
      <div id="reviews" className="py-16 bg-gray-50 text-center">
          <h2 className="text-2xl font-bold mb-4">Reseñas de Clientes</h2>
          <p className="text-gray-500">Próximamente: Sistema de reseñas integrado.</p>
      </div>

    </div>
  );
}
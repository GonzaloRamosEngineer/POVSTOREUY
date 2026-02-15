import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header'; 

// --- COMPONENTES DEL PRODUCTO ---
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';
import ProductStickyNav from '@/app/product-details/components/ProductStickyNav';
import DynamicStoryRenderer, { StoryBlock } from '@/app/product-details/components/DynamicStoryRenderer';
import TechSpecsTable from '@/app/product-details/components/TechSpecsTable'; 
import ProductComparison from '@/app/product-details/components/ProductComparison';
import ProductFAQ from '@/app/product-details/components/ProductFAQ';
import CommunitySection from '@/app/product-details/components/CommunitySection'; 
import ProductReviewsSection from '@/app/product-details/components/ProductReviewsSection';

// --- UTILIDADES Y TIPOS ---
import { Product } from '@/types/product'; 
import { normalizeReviewRow } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ id: string }>;
};

// SEO Metadata
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

  // 1. Fetch de productos para catálogo y comparativas
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error || !allProducts) notFound();

  const rawProduct = allProducts.find((p) => p.id === id);
  if (!rawProduct) notFound();

  // 2. Fetch de reseñas REALES
  const { data: reviewsData } = await supabase
    .from('product_reviews')
    .select(`
      *,
      user_profiles(full_name)
    `)
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  const reviews = (reviewsData || []).map(normalizeReviewRow);

  // 3. Lógica de Puntaje Dinámico
  const totalReviewsCount = reviews.length;
  const averageRatingValue = totalReviewsCount > 0 
    ? Number((reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviewsCount).toFixed(1))
    : 0;

  const otherProducts = allProducts.filter(p => p.id !== id);
  const product = rawProduct as unknown as Product;
  
  const formattedGallery = [
    { id: 'main-image', url: product.image_url, alt: `${product.name} principal`, type: 'image' as const },
    ...(product.video_url ? [{ id: 'video-main', url: product.video_url, alt: `Video de ${product.name}`, type: 'video' as const }] : []),
    ...(product.gallery || []).map((url: string, index: number) => ({
      id: `gallery-${index}`, url: url, alt: `${product.name} vista ${index + 1}`, type: 'image' as const
    })),
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-red-100 selection:text-red-900">
      
      <Header />
      
      {/* 1. STICKY NAV */}
      <ProductStickyNav 
        productName={product.name}
        productPrice={product.price}
        productImage={product.image_url}
        averageRating={averageRatingValue}
        totalReviews={totalReviewsCount}
      />

      {/* 2. OVERVIEW (Sección Inicial) */}
      <div id="overview" className="pt-24 pb-12">
        <ProductDetailsInteractive 
          productInitial={{
            ...rawProduct,
            rating: averageRatingValue,
            review_count: totalReviewsCount 
          } as any} 
          galleryInitial={formattedGallery} 
        />
      </div>

      {/* 3. HISTORIA VISUAL */}
      {product.story_content && product.story_content.length > 0 && (
        <div className="border-t border-gray-100">
           <DynamicStoryRenderer content={product.story_content as unknown as StoryBlock[]} />
        </div>
      )}

      {/* 4. ESPECIFICACIONES (Fondo Gris) */}
      <div id="specs" className="py-24 bg-gray-50 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-4">
            <TechSpecsTable specs={product.tech_specs} />
         </div>
      </div>

      {/* 5. COMPARATIVA (Fondo Blanco) */}
      <div id="compare" className="py-24 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Comparativa de Modelos
            </h2>
            <ProductComparison 
                currentProduct={{ ...product, rating: averageRatingValue, review_count: totalReviewsCount } as any} 
                otherProducts={otherProducts as unknown as any[]} 
            />
        </div>
      </div>

      {/* 6. RESEÑAS (Fondo Gris - Subió de posición) */}
      <div id="reviews" className="py-24 bg-gray-50 border-t border-gray-100">
          <ProductReviewsSection reviews={reviews} />
      </div>

      {/* 7. PREGUNTAS FRECUENTES (Fondo Blanco - Bajó de posición) */}
      {product.faq_content && product.faq_content.length > 0 && (
        <div id="faq" className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
             <ProductFAQ faqs={product.faq_content} />
          </div>
        </div>
      )}

      {/* 8. COMUNIDAD (Final de página) */}
      <div className="border-t border-gray-100">
        <CommunitySection />
      </div>

    </div>
  );
}
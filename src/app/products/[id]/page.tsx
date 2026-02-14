import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
// ELIMINADO: import Footer from '@/components/common/Footer'; (Ya está en layout.tsx)

// --- COMPONENTES DEL PRODUCTO ---
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';
import ProductStickyNav from '@/app/product-details/components/ProductStickyNav';
// Importamos tipos para corregir error TS
import DynamicStoryRenderer, {
  StoryBlock,
} from '@/app/product-details/components/DynamicStoryRenderer';
import TechSpecsTable from '@/app/product-details/components/TechSpecsTable';
import ProductComparison from '@/app/product-details/components/ProductComparison';
import ProductFAQ from '@/app/product-details/components/ProductFAQ';
import CommunitySection from '@/app/product-details/components/CommunitySection';
import CustomerReviews from '@/app/product-details/components/CustomerReviews';

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

  // 1. Traemos productos
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error || !allProducts) notFound();

  // 2. Producto actual
  const rawProduct = allProducts.find((p) => p.id === id);
  if (!rawProduct) notFound();

  // 3. Otros productos
  const otherProducts = allProducts.filter((p) => p.id !== id);

  // 3.1 Reseñas del producto
  const { data: productReviewsData } = await supabase
    .from('product_reviews')
    .select(
      'id, product_id, rating, review_text, is_verified_purchase, created_at, user_profiles(full_name), products(name, model)'
    )
    .eq('product_id', id)
    .not('review_text', 'is', null)
    .order('created_at', { ascending: false });

  const reviews = (productReviewsData ?? []).map((r: any) => normalizeReviewRow(r));
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : Number(rawProduct?.rating ?? 0);

  // Casting
  const product = rawProduct as unknown as Product;

  // 4. Galería
  const formattedGallery = [
    {
      id: 'main-image',
      url: product.image_url,
      alt: `${product.name} principal`,
      type: 'image' as const,
    },
    ...(product.video_url
      ? [
          {
            id: 'video-main',
            url: product.video_url,
            alt: `Video de ${product.name}`,
            type: 'video' as const,
          },
        ]
      : []),
    ...(product.gallery || []).map((url: string, index: number) => ({
      id: `gallery-${index}`,
      url: url,
      alt: `${product.name} vista ${index + 1}`,
      type: 'image' as const,
    })),
  ];

  return (
    // MODO CLARO: bg-white text-neutral-900
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-red-100 selection:text-red-900">
      {/* Si el Header también se duplica, borra esta línea <Header /> igual que hicimos con el Footer */}
      <Header />

      {/* 1. STICKY NAV */}
      <ProductStickyNav
        productName={product.name}
        productPrice={product.price}
        productImage={product.image_url}
      />

      {/* 2. OVERVIEW */}
      <div id="overview" className="pt-24 pb-12">
        <ProductDetailsInteractive productInitial={rawProduct} galleryInitial={formattedGallery} />
      </div>

      {/* 3. HISTORIA VISUAL */}
      {product.story_content && product.story_content.length > 0 && (
        <div className="border-t border-gray-100">
          <DynamicStoryRenderer content={product.story_content as unknown as StoryBlock[]} />
        </div>
      )}

      {/* 4. ESPECIFICACIONES (Sin título duplicado) */}
      <div id="specs" className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <TechSpecsTable specs={product.tech_specs} />
        </div>
      </div>

      {/* 5. COMPARATIVA */}
      <div id="compare" className="py-24 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Comparativa de Modelos
          </h2>
          <ProductComparison
            currentProduct={product}
            otherProducts={otherProducts as unknown as any[]}
          />
        </div>
      </div>

      {/* 6. COMUNIDAD */}
      <CommunitySection />

      {/* 7. PREGUNTAS FRECUENTES (Sin título duplicado) */}
      {product.faq_content && product.faq_content.length > 0 && (
        <div id="faq" className="py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <ProductFAQ faqs={product.faq_content} />
          </div>
        </div>
      )}

      {/* 8. RESEÑAS */}
      <div id="reviews" className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          {totalReviews > 0 ? (
            <CustomerReviews
              reviews={reviews}
              averageRating={averageRating}
              totalReviews={totalReviews}
            />
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Opiniones de Clientes</h2>
              <p className="text-gray-500">Este producto todavía no tiene reseñas publicadas.</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ELIMINADO AQUI PORQUE YA VIENE DEL LAYOUT GLOBAL */}
    </div>
  );
}

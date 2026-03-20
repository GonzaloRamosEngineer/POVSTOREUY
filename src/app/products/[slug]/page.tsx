import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

// --- COMPONENTES DEL PRODUCTO ---
import ProductDetailsInteractive from '@/app/product-details/components/ProductDetailsInteractive';
import DynamicStoryRenderer, { StoryBlock } from '@/app/product-details/components/DynamicStoryRenderer';
import TechSpecsTable from '@/app/product-details/components/TechSpecsTable';
// import ProductComparison from '@/app/product-details/components/ProductComparison';
import ProductFAQ from '@/app/product-details/components/ProductFAQ';
// import CommunitySection from '@/app/product-details/components/CommunitySection';
import ProductReviewsSection from '@/app/product-details/components/ProductReviewsSection';

// --- UTILIDADES Y TIPOS ---
import { normalizeReviewRow } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ slug: string }>;
};

function cleanMarkdown(text: string | null) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/#+/g, '')
    .substring(0, 160);
}

const isUUID = (str: string) => {
  const regexExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regexExp.test(str);
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  let query = supabase.from('products').select('name, description');
  if (isUUID(slug)) {
    query = query.eq('id', slug);
  } else {
    query = query.eq('slug', slug);
  }

  const { data: product } = await query.single();

  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: `${product.name} - POV Store Uruguay`,
    description: cleanMarkdown(product.description),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let productQuery = supabase.from('products').select('*');
  if (isUUID(slug)) {
    productQuery = productQuery.eq('id', slug);
  } else {
    productQuery = productQuery.eq('slug', slug);
  }

  const [{ data: product }] = await Promise.all([productQuery.single()]);

  if (!product) notFound();

  const { data: reviewsData, error: reviewsError } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching product reviews:', reviewsError);
  }

  const reviews = (reviewsData || []).map(normalizeReviewRow);
  const totalReviewsCount = reviews.length;
  const averageRatingValue =
    totalReviewsCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount
      : 5.0;

  const formattedGallery = [
    {
      id: 'main',
      url: product.image_url,
      alt: product.name,
      type: 'image' as const,
    },
    ...(product.gallery || []).map((url: string, i: number) => ({
      id: `gal-${i}`,
      url,
      alt: `${product.name} ${i}`,
      type: 'image' as const,
    })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ NO renderizamos Header acá porque ya viene desde layout.tsx */}

      <main className="pt-0">
        <section id="overview" className="max-w-7xl mx-auto px-4 py-0 md:py-0">
          <ProductDetailsInteractive
            productInitial={
              {
                ...product,
                resumen: product.tagline || '',
                rating: averageRatingValue,
                review_count: totalReviewsCount,
              } as any
            }
            galleryInitial={formattedGallery}
          />
        </section>

        {product.story_content && (
          <section className="w-full">
            <DynamicStoryRenderer
              content={product.story_content as unknown as StoryBlock[]}
            />
          </section>
        )}

        {/* <CommunitySection /> */}

        <div id="specs" className="py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <TechSpecsTable specs={product.tech_specs} />
          </div>
        </div>

        {/*
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
        */}

        <div id="reviews" className="py-24 bg-gray-50 border-t border-gray-100">
          <ProductReviewsSection reviews={reviews} />
        </div>

        {product.faq_content && product.faq_content.length > 0 && (
          <div id="faq" className="py-24 bg-white border-t border-gray-100">
            <ProductFAQ faqs={product.faq_content} />
          </div>
        )}
      </main>
    </div>
  );
}
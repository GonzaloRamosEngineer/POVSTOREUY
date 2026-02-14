'use client';

import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { AppReview } from '@/lib/reviews';

interface TestimonialsSectionProps {
  reviews: AppReview[];
  loading?: boolean;
  error?: string | null;
}

const TestimonialsSection = ({
  reviews,
  loading = false,
  error = null,
}: TestimonialsSectionProps) => {
  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden border-t border-neutral-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-900/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Comentarios Reales
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Reseñas verificadas de compradores reales de POV Store Uruguay.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-neutral-800 bg-neutral-900/60 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-6 text-center max-w-3xl mx-auto">
            <p className="text-red-300 font-semibold">No pudimos cargar reseñas en este momento.</p>
            <p className="text-sm text-neutral-400 mt-2">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-10 text-center max-w-3xl mx-auto">
            <p className="text-neutral-300 font-semibold">Aún no hay reseñas publicadas.</p>
            <p className="text-sm text-neutral-500 mt-2">
              Cuando carguen nuevas reseñas, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                    <AppImage
                      src={review.authorImage}
                      alt={review.authorImageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{review.author}</p>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <Icon
                            name="CheckBadgeIcon"
                            size={12}
                            variant="solid"
                            className="text-green-400"
                          />
                          Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{review.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="StarIcon"
                      size={14}
                      variant={i < review.rating ? 'solid' : 'outline'}
                      className={i < review.rating ? 'text-yellow-400' : 'text-neutral-600'}
                    />
                  ))}
                </div>

                {review.productName && (
                  <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
                    {review.productName}
                  </p>
                )}
                <p className="text-sm text-neutral-300 leading-relaxed">“{review.comment}”</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;

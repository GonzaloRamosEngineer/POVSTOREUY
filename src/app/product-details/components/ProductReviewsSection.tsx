'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { AppReview } from '@/lib/reviews';

const REVIEWS_PER_PAGE = 5;

export default function ProductReviewsSection({ reviews }: { reviews: AppReview[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Opiniones de Clientes</h2>
        <p className="text-gray-500">Aún no hay reseñas para este producto.</p>
      </div>
    );
  }

  // Lógica de paginación
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const visibleReviews = reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-bold mb-12 text-gray-900 text-center">Opiniones de Clientes</h2>

      <div className="space-y-12">
        {visibleReviews.map((review) => (
          <article key={review.id} className="border-b border-gray-100 pb-12 last:border-0">
            {/* Estrellas y Fecha */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex text-red-600">
                {[...Array(5)].map((_, i) => (
                  <Icon 
                    key={i} 
                    name="StarIcon" 
                    size={18} 
                    variant={i < review.rating ? 'solid' : 'outline'} 
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">{review.date}</span>
            </div>

            {/* Autor y Verificación */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-neutral-500 border border-gray-200">
                {review.author[0]}
              </div>
              <div>
                <span className="font-bold text-gray-900 block leading-tight">{review.author}</span>
                {review.verified && (
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                    Compra verificada
                  </span>
                )}
              </div>
            </div>

            {/* Texto de la Reseña */}
            <p className="text-gray-700 leading-relaxed mb-6 italic">
              "{review.comment}"
            </p>

            {/* Galería de imágenes (Inyectadas manualmente) */}
            {review.images && review.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {review.images.map((imgUrl, idx) => (
                  <div key={idx} className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <AppImage 
                      src={imgUrl} 
                      alt={`Review image ${idx + 1}`} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 disabled:opacity-30 text-gray-400"
          >
            <Icon name="ChevronLeftIcon" size={20} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                currentPage === i + 1 
                ? 'bg-red-600 text-white' 
                : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 disabled:opacity-30 text-gray-400"
          >
            <Icon name="ChevronRightIcon" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
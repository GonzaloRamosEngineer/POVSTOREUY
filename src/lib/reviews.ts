/**
 * src/lib/reviews.ts
 * Motor de normalización de reseñas para POV Store Uruguay
 */

export type AppReview = {
  id: string;
  author: string;
  authorImage: string;
  authorImageAlt: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  productId: string;
  productName?: string;
  images: string[]; // Galería de fotos reales (WhatsApp/IG)
};

function asString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatUYDate(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  return d.toLocaleDateString('es-UY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Normaliza filas provenientes de product_reviews
 * Prioriza la carga manual (Ventas externas) sobre los perfiles de la DB
 */
export function normalizeReviewRow(row: any): AppReview {
  const profile = row?.user_profiles;
  const product = row?.products;

  // Prioridad: Nombre manual (WhatsApp) > Nombre perfil (DB) > Genérico
  const finalAuthor = asString(row?.customer_name_manual || profile?.full_name || 'Cliente POV');

  const productName = [asString(product?.name), asString(product?.model)]
    .filter(Boolean)
    .join(' - ')
    .trim();

  return {
    id: asString(row?.id || `review-${Math.random().toString(36).slice(2)}`),
    author: finalAuthor,
    authorImage: asString(row?.customer_avatar_url || '/assets/images/no_image.png'),
    authorImageAlt: `Foto de ${finalAuthor}`,
    rating: Math.min(5, Math.max(1, Math.round(asNumber(row?.rating, 5)))),
    date: formatUYDate(row?.created_at),
    comment: asString(row?.review_text),
    verified: Boolean(row?.is_verified_purchase),
    productId: asString(row?.product_id),
    productName: productName || undefined,
    images: Array.isArray(row?.review_images_gallery) ? row.review_images_gallery : [],
  };
}
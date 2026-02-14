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
 * Normaliza filas provenientes de `product_reviews` (+ joins opcionales)
 * Estructura esperada de DB:
 * - product_reviews.rating
 * - product_reviews.review_text
 * - product_reviews.is_verified_purchase
 * - product_reviews.created_at
 * - product_reviews.product_id
 * - user_profiles.full_name (join opcional)
 * - products.name / products.model (join opcional)
 */
export function normalizeReviewRow(row: any): AppReview {
  const profile = row?.user_profiles;
  const product = row?.products;

  const productName = [asString(product?.name), asString(product?.model)]
    .filter(Boolean)
    .join(' - ')
    .trim();

  return {
    id: asString(row?.id || `review-${Math.random().toString(36).slice(2)}`),
    author: asString(profile?.full_name || 'Cliente POV'),
    authorImage: '/assets/images/no_image.png',
    authorImageAlt: asString(profile?.full_name || 'Foto del cliente'),
    rating: Math.min(5, Math.max(1, Math.round(asNumber(row?.rating, 5)))),
    date: formatUYDate(row?.created_at),
    comment: asString(row?.review_text),
    verified: Boolean(row?.is_verified_purchase),
    productId: asString(row?.product_id),
    productName: productName || undefined,
  };
}

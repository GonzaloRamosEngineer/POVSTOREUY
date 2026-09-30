import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { searchCatalogRows, type CatalogProductRow } from './catalogSearch';

export type MatchbotCatalogProduct = {
  id: string;
  name: string;
  model: string | null;
  price: number;
  cash_price: number | null;
  card_price: number | null;
  stock_count: number;
  stock_status: string | null;
  url: string;
};

export async function queryLiveCatalog(query: string, limit = 5): Promise<MatchbotCatalogProduct[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, model, description, price, cash_price, card_price, stock_count, stock_status')
    .eq('is_active', true)
    .limit(250);

  if (error) throw new Error('catalog_unavailable');

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://povstore.uy').replace(/\/$/, '');
  return searchCatalogRows(query, (data ?? []) as CatalogProductRow[], limit).map((product) => ({
    id: product.id,
    name: String(product.name ?? ''),
    model: product.model ? String(product.model) : null,
    price: Number(product.price ?? 0),
    cash_price: product.cash_price == null ? null : Number(product.cash_price),
    card_price: product.card_price == null ? null : Number(product.card_price),
    stock_count: Math.max(0, Number(product.stock_count ?? 0)),
    stock_status: product.stock_status ?? null,
    url: `${siteUrl}/products/${product.slug || product.id}`,
  }));
}

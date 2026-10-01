import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  buildProductsLookup,
  computePackEffectiveStock,
  type PackComponentLike,
} from '@/lib/packs/computePackStock';
import { searchCatalogRows, type CatalogProductRow } from './catalogSearch';
import { createMatchbotCheckoutUrl } from './matchbotCheckout';

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
  checkout_url: string;
};

type CatalogPack = {
  id?: unknown;
  name?: unknown;
  tagline?: unknown;
  price?: unknown;
  cash_price?: unknown;
  card_price?: unknown;
  includes?: unknown;
  components?: unknown;
  badge?: { text?: unknown } | null;
};

type CatalogSourceRow = CatalogProductRow & {
  is_active?: boolean;
  packs?: unknown;
};

type SearchableCatalogRow = CatalogProductRow & {
  catalog_url: string;
  checkout_product_id: string;
  checkout_pack_id: string | null;
};

function parsePacks(value: unknown): CatalogPack[] {
  if (Array.isArray(value)) return value as CatalogPack[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as CatalogPack[]) : [];
  } catch {
    return [];
  }
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function packDescription(product: CatalogSourceRow, pack: CatalogPack): string {
  const includes = Array.isArray(pack.includes) ? pack.includes : [];
  return [product.description, pack.tagline, pack.badge?.text, ...includes]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

function searchableRows(products: CatalogSourceRow[], siteUrl: string): SearchableCatalogRow[] {
  const productLookup = buildProductsLookup(
    products.map((product) => ({
      id: product.id,
      name: product.name ?? undefined,
      stock_count: product.stock_count,
      is_active: product.is_active,
    }))
  );
  const rows: SearchableCatalogRow[] = [];

  for (const product of products) {
    const productUrl = `${siteUrl}/products/${product.slug || product.id}`;
    rows.push({
      ...product,
      is_pack: false,
      catalog_url: productUrl,
      checkout_product_id: product.id,
      checkout_pack_id: null,
    });

    for (const pack of parsePacks(product.packs)) {
      const packId = String(pack.id ?? '').trim();
      const packName = String(pack.name ?? '').trim();
      const price = optionalNumber(pack.price);
      if (!packId || !packName || price === null) continue;

      const stock = computePackEffectiveStock(
        {
          id: packId,
          components: Array.isArray(pack.components)
            ? (pack.components as PackComponentLike[])
            : [],
        },
        productLookup
      ).stock;

      rows.push({
        id: `${product.id}::${packId}`,
        slug: product.slug,
        name: `${String(product.name ?? '').trim()} — ${packName}`,
        model: product.model,
        description: packDescription(product, pack),
        price,
        cash_price: optionalNumber(pack.cash_price),
        card_price: optionalNumber(pack.card_price),
        stock_count: stock,
        stock_status: stock === 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock',
        is_accessory: product.is_accessory,
        is_pack: true,
        catalog_url: `${productUrl}?pack=${encodeURIComponent(packId)}`,
        checkout_product_id: product.id,
        checkout_pack_id: packId,
      });
    }
  }

  return rows;
}

export async function queryLiveCatalog(
  query: string,
  limit = 5
): Promise<MatchbotCatalogProduct[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, model, description, price, cash_price, card_price, stock_count, stock_status, is_active, is_accessory, packs'
    )
    .eq('is_active', true)
    .limit(250);

  if (error) throw new Error('catalog_unavailable');

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://povstore.uy'
  ).replace(/\/$/, '');
  const checkoutSecret = process.env.MATCHBOT_CATALOG_SECRET;
  if (!checkoutSecret) throw new Error('integration_not_configured');
  const candidates = searchableRows((data ?? []) as CatalogSourceRow[], siteUrl);
  return searchCatalogRows(query, candidates, limit).map((product) => {
    const row = product as SearchableCatalogRow;
    return {
      id: product.id,
      name: String(product.name ?? ''),
      model: product.model ? String(product.model) : null,
      price: Number(product.price ?? 0),
      cash_price: product.cash_price == null ? null : Number(product.cash_price),
      card_price: product.card_price == null ? null : Number(product.card_price),
      stock_count: Math.max(0, Number(product.stock_count ?? 0)),
      stock_status: product.stock_status ?? null,
      url: row.catalog_url,
      checkout_url: createMatchbotCheckoutUrl({
        siteUrl,
        secret: checkoutSecret,
        productId: row.checkout_product_id,
        packId: row.checkout_pack_id,
      }),
    };
  });
}

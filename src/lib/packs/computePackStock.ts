/**
 * Cálculo del stock efectivo de un pack/kit como función pura de los
 * componentes y sus respectivos `stock_count`.
 *
 * El stock de un pack NO es un campo editable. Se deriva de:
 *   effective_stock = MIN( floor(component.stock_count / component.quantity) )
 *
 * Si algún componente referenciado no existe en el diccionario o está inactivo,
 * el pack se considera no armable (stock = 0).
 *
 * Ver CLAUDE.md → "Stock de packs es DERIVADO".
 */

export interface PackComponentLike {
  product_id: string;
  quantity: number;
  role?: string;
}

export interface PackLike {
  id?: string;
  components?: PackComponentLike[] | null;
}

export interface ProductStockLike {
  id: string;
  name?: string;
  stock_count?: number | null;
  is_active?: boolean;
}

export interface PackStockBreakdown {
  product_id: string;
  product_name?: string;
  available: number; // stock_count del componente (clampeado a 0 si es null/neg)
  per_kit: number;   // pack.components[].quantity
  kits_supported: number; // floor(available / per_kit)
}

export interface PackStockResult {
  stock: number; // Math.max(0, min(kits_supported))
  limiting?: PackStockBreakdown; // qué componente fue el cuello de botella
  breakdown: PackStockBreakdown[]; // todos los componentes evaluados
  ok: boolean; // false si el pack no tiene componentes válidos
}

type ProductsLookup =
  | Map<string, ProductStockLike>
  | Record<string, ProductStockLike>;

function lookup(
  productsById: ProductsLookup,
  id: string
): ProductStockLike | undefined {
  if (productsById instanceof Map) return productsById.get(id);
  return productsById[id];
}

function clampStock(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function computePackEffectiveStock(
  pack: PackLike | null | undefined,
  productsById: ProductsLookup
): PackStockResult {
  const components = Array.isArray(pack?.components) ? pack!.components! : [];

  if (components.length === 0) {
    return { stock: 0, breakdown: [], ok: false };
  }

  const breakdown: PackStockBreakdown[] = [];

  for (const c of components) {
    const productId = String(c?.product_id || '').trim();
    const perKit = Number(c?.quantity || 0);

    if (!productId || !Number.isFinite(perKit) || perKit <= 0) {
      // Componente malformado → pack no armable
      return { stock: 0, breakdown, ok: false };
    }

    const product = lookup(productsById, productId);

    if (!product || product.is_active === false) {
      // Componente faltante o inactivo → pack no armable
      breakdown.push({
        product_id: productId,
        product_name: product?.name,
        available: 0,
        per_kit: perKit,
        kits_supported: 0,
      });
      return {
        stock: 0,
        limiting: breakdown[breakdown.length - 1],
        breakdown,
        ok: false,
      };
    }

    const available = clampStock(product.stock_count);
    const kits_supported = Math.floor(available / perKit);

    breakdown.push({
      product_id: productId,
      product_name: product.name,
      available,
      per_kit: perKit,
      kits_supported,
    });
  }

  // Encontrar el limitante (kits_supported mínimo)
  let limiting = breakdown[0];
  for (const b of breakdown) {
    if (b.kits_supported < limiting.kits_supported) limiting = b;
  }

  return {
    stock: Math.max(0, limiting.kits_supported),
    limiting,
    breakdown,
    ok: true,
  };
}

/**
 * Atajo: devuelve solo el número de stock (para sitios que no necesitan el breakdown).
 */
export function getPackEffectiveStock(
  pack: PackLike | null | undefined,
  productsById: ProductsLookup
): number {
  return computePackEffectiveStock(pack, productsById).stock;
}

/**
 * Construye un Map<id, ProductStockLike> desde un array de rows de Supabase.
 * Conveniencia para llamadores que tienen los productos como array.
 */
export function buildProductsLookup(
  products: ProductStockLike[]
): Map<string, ProductStockLike> {
  const m = new Map<string, ProductStockLike>();
  for (const p of products) {
    if (p?.id) m.set(p.id, p);
  }
  return m;
}

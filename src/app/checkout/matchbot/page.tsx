import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyMatchbotCheckoutToken } from '@/lib/integrations/matchbotCheckout';
import {
  buildProductsLookup,
  computePackEffectiveStock,
  type ProductStockLike,
} from '@/lib/packs/computePackStock';
import type { CartItem } from '@/lib/cart';
import MatchbotCheckoutBootstrap from './MatchbotCheckoutBootstrap';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ intent?: string }> };

function parsePacks(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function optionalPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function CheckoutError({ expired = false }: { expired?: boolean }) {
  return (
    <main className="min-h-[70vh] bg-background px-6 py-20 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">
          {expired ? 'Este enlace venció' : 'No pudimos preparar la compra'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Volvé a WhatsApp para pedir un enlace nuevo o elegí el producto desde la tienda.
        </p>
        <Link href="/homepage" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">
          Ir a POV Store
        </Link>
      </div>
    </main>
  );
}

export default async function MatchbotCheckoutPage({ searchParams }: Props) {
  const { intent: token = '' } = await searchParams;
  const secret = process.env.MATCHBOT_CATALOG_SECRET;
  if (!secret || !token) return <CheckoutError />;

  const verified = verifyMatchbotCheckoutToken({ secret, token });
  if (verified.ok === false) return <CheckoutError expired={verified.reason === 'expired'} />;

  const supabase = getSupabaseAdmin();
  const { data: product, error } = await supabase
    .from('products')
    .select('id,name,model,price,cash_price,card_price,image_url,stock_count,is_active,packs')
    .eq('id', verified.intent.product_id)
    .eq('is_active', true)
    .single();
  if (error || !product) return <CheckoutError />;

  let item: CartItem;
  if (verified.intent.pack_id) {
    const pack = parsePacks(product.packs).find(
      (candidate) => String(candidate?.id || '') === verified.intent.pack_id
    );
    const price = optionalPrice(pack?.price);
    if (!pack || price === null || !Array.isArray(pack.components) || pack.components.length === 0) {
      return <CheckoutError />;
    }

    const componentIds = Array.from(
      new Set(pack.components.map((component: any) => String(component?.product_id || '')).filter(Boolean))
    );
    const { data: components } = await supabase
      .from('products')
      .select('id,name,stock_count,is_active')
      .in('id', componentIds);
    const stockRows: ProductStockLike[] = (components || []).map((component: any) => ({
      id: component.id,
      name: component.name,
      stock_count: Number(component.stock_count || 0),
      is_active: component.is_active !== false,
    }));
    if (!stockRows.some((component) => component.id === product.id)) {
      stockRows.push({
        id: product.id,
        name: product.name,
        stock_count: Number(product.stock_count || 0),
        is_active: true,
      });
    }
    const stock = computePackEffectiveStock(pack, buildProductsLookup(stockRows)).stock;
    if (stock < verified.intent.quantity) return <CheckoutError />;

    const name = `${product.name} - ${String(pack.name || 'Kit')}`;
    item = {
      id: `pack::${product.id}::${pack.id}`,
      type: 'pack',
      parent_product_id: product.id,
      pack_id: String(pack.id),
      name,
      model: product.model || '',
      price,
      price_preview: price,
      cash_price: optionalPrice(pack.cash_price),
      card_price: optionalPrice(pack.card_price),
      quantity: verified.intent.quantity,
      stock,
      image: Array.isArray(pack.images) && pack.images[0] ? String(pack.images[0]) : product.image_url,
      alt: name,
    };
  } else {
    const stock = Math.max(0, Number(product.stock_count || 0));
    if (stock < verified.intent.quantity) return <CheckoutError />;
    item = {
      id: product.id,
      type: 'product',
      product_id: product.id,
      name: product.name,
      model: product.model || '',
      price: Number(product.price || 0),
      cash_price: optionalPrice(product.cash_price),
      card_price: optionalPrice(product.card_price),
      quantity: verified.intent.quantity,
      stock,
      image: product.image_url,
      alt: product.name,
    };
  }

  return <MatchbotCheckoutBootstrap item={item} token={token} intentId={verified.intent.intent_id} />;
}

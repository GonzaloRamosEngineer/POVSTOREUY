export type CatalogProductRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
  model?: string | null;
  description?: string | null;
  price?: number | string | null;
  cash_price?: number | string | null;
  card_price?: number | string | null;
  stock_count?: number | null;
  stock_status?: string | null;
};

const STOP_WORDS = new Set([
  'a', 'al', 'algo', 'con', 'cuanto', 'cuesta', 'de', 'del', 'el', 'en', 'es', 'esta', 'hay',
  'la', 'las', 'lo', 'los', 'me', 'modelo', 'para', 'por', 'precio', 'que', 'queda', 'quedan',
  'stock', 'tenes', 'tienen', 'un', 'una', 'y',
  'available', 'do', 'have', 'how', 'in', 'is', 'much', 'of', 'price', 'the', 'you',
]);

export function normalizeCatalogText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function catalogQueryTokens(query: string): string[] {
  return [...new Set(normalizeCatalogText(query).split(' ')
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))]
    .slice(0, 12);
}

export function scoreCatalogProduct(query: string, product: CatalogProductRow): number {
  const tokens = catalogQueryTokens(query);
  if (tokens.length === 0) return 0;

  const name = normalizeCatalogText(product.name);
  const model = normalizeCatalogText(product.model);
  const description = normalizeCatalogText(product.description);
  const searchable = `${name} ${model} ${description}`.trim();
  let score = 0;

  for (const token of tokens) {
    if (model === token) score += 12;
    else if (model.split(' ').includes(token)) score += 8;
    else if (model.includes(token)) score += 5;

    if (name.split(' ').includes(token)) score += 6;
    else if (name.includes(token)) score += 3;

    if (description.includes(token)) score += 1;
  }

  const phrase = tokens.join(' ');
  if (phrase.length >= 3 && searchable.includes(phrase)) score += 8;
  return score;
}

export function searchCatalogRows(query: string, rows: CatalogProductRow[], limit = 5): CatalogProductRow[] {
  return rows
    .map((product) => ({ product, score: scoreCatalogProduct(query, product) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name)))
    .slice(0, Math.min(Math.max(limit, 1), 10))
    .map(({ product }) => product);
}

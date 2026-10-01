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
  is_accessory?: boolean | null;
  is_pack?: boolean | null;
};

const MOVEMENT_INTENT = new Set([
  'caballo',
  'correr',
  'cuatri',
  'deporte',
  'downhill',
  'esqui',
  'gimnasio',
  'moto',
  'motocross',
  'mtb',
  'natacion',
  'patin',
  'running',
  'trekking',
  'trotar',
]);

const STOP_WORDS = new Set([
  'a',
  'al',
  'algo',
  'buenas',
  'con',
  'cuanto',
  'cuesta',
  'de',
  'del',
  'disponible',
  'disponibles',
  'el',
  'en',
  'es',
  'esta',
  'hay',
  'hola',
  'la',
  'las',
  'lo',
  'los',
  'me',
  'modelo',
  'necesito',
  'para',
  'por',
  'precio',
  'que',
  'queda',
  'quedan',
  'quiero',
  'quisiera',
  'stock',
  'tenes',
  'tienen',
  'un',
  'una',
  'y',
  'available',
  'do',
  'have',
  'how',
  'in',
  'is',
  'much',
  'of',
  'price',
  'the',
  'you',
]);

function tokenVariants(token: string): string[] {
  if (/^[a-z]+s$/.test(token) && token.length > 3) return [token, token.slice(0, -1)];
  return [token];
}

export function normalizeCatalogText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function catalogQueryTokens(query: string): string[] {
  return [
    ...new Set(
      normalizeCatalogText(query)
        .split(' ')
        .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
    ),
  ].slice(0, 12);
}

export function scoreCatalogProduct(query: string, product: CatalogProductRow): number {
  const tokens = catalogQueryTokens(query);
  if (tokens.length === 0) return 0;

  const name = normalizeCatalogText(product.name);
  const model = normalizeCatalogText(product.model);
  const description = normalizeCatalogText(product.description);
  const searchable = `${name} ${model} ${description}`.trim();
  let score = 0;

  const asksForCamera = tokens.some((token) => tokenVariants(token).includes('camara'));
  const asksForAccessory = tokens.some((token) => tokenVariants(token).includes('accesorio'));
  const asksForMovement = tokens.some((token) => MOVEMENT_INTENT.has(token));
  const supportsMovement =
    model.includes('c200') ||
    searchable.includes('estabilizador') ||
    searchable.includes('gyro') ||
    searchable.includes('6 ejes');
  if (asksForCamera && product.is_accessory === false) score += 10;
  if (asksForAccessory && product.is_accessory === true) score += 10;
  if (asksForMovement && supportsMovement) score += 24;

  for (const token of tokens) {
    const variants = tokenVariants(token);
    const modelWords = model.split(' ');
    const nameWords = name.split(' ');

    if (variants.some((variant) => model === variant)) score += 12;
    else if (variants.some((variant) => modelWords.includes(variant))) score += 8;
    else if (variants.some((variant) => model.includes(variant))) score += 5;

    if (variants.some((variant) => nameWords.includes(variant))) score += 6;
    else if (variants.some((variant) => name.includes(variant))) score += 3;

    if (variants.some((variant) => description.includes(variant))) score += 1;
  }

  const phrase = tokens.join(' ');
  if (phrase.length >= 3 && searchable.includes(phrase)) score += 8;
  if (score > 0 && product.is_pack) score += 2;
  return score;
}

export function searchCatalogRows(
  query: string,
  rows: CatalogProductRow[],
  limit = 5
): CatalogProductRow[] {
  return rows
    .map((product) => ({ product, score: scoreCatalogProduct(query, product) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name))
    )
    .slice(0, Math.min(Math.max(limit, 1), 10))
    .map(({ product }) => product);
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signMatchbotRequest } from '@/lib/integrations/matchbotAuth';

const baseProducts = [
  {
    id: 'p1',
    slug: 'x200',
    name: 'Cámara POV X200',
    model: 'X200',
    description: 'Cámara deportiva',
    price: 12500,
    cash_price: 11900,
    card_price: 12500,
    stock_count: 3,
    stock_status: 'in_stock',
    is_active: true,
    packs: [],
  },
];

let products: Array<Record<string, unknown>> = baseProducts;
const limit = vi.fn(async () => ({ data: products, error: null }));
const eq = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({ from }),
}));

const { POST } = await import('./route');

describe('POST /api/integrations/matchbot/catalog', () => {
  beforeEach(() => {
    process.env.MATCHBOT_CATALOG_SECRET = 'connector-secret';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://povstore.uy';
    products = baseProducts;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MATCHBOT_CATALOG_SECRET;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('rechaza requests sin firma antes de consultar la base', async () => {
    const response = await POST(
      new Request('https://povstore.uy/api/integrations/matchbot/catalog', {
        method: 'POST',
        body: JSON.stringify({ action: 'search', query: 'X200' }),
      })
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('devuelve sólo el DTO permitido para una búsqueda firmada', async () => {
    const rawBody = JSON.stringify({ action: 'search', query: '¿Tienen la X200?', limit: 5 });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signMatchbotRequest('connector-secret', timestamp, rawBody);
    const response = await POST(
      new Request('https://povstore.uy/api/integrations/matchbot/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-matchbot-timestamp': timestamp,
          'x-matchbot-signature': signature,
        },
        body: rawBody,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tool).toBe('catalog.search');
    expect(body.products).toEqual([
      {
        id: 'p1',
        name: 'Cámara POV X200',
        model: 'X200',
        price: 12500,
        cash_price: 11900,
        card_price: 12500,
        stock_count: 3,
        stock_status: 'in_stock',
        url: 'https://povstore.uy/products/x200',
      },
    ]);
    expect(body.products[0]).not.toHaveProperty('description');
  });

  it('expone los packs como productos comprables con stock derivado y URL seleccionada', async () => {
    products = [
      {
        ...baseProducts[0],
        packs: [
          {
            id: 'x200-moto-pro',
            name: 'Kit Moto/Bici Pro',
            tagline: 'Para moto, bici y aventura',
            price: 13690,
            cash_price: 11990,
            card_price: 13690,
            includes: ['Cámara', 'MicroSD 64GB', 'Soporte de manillar'],
            components: [
              { product_id: 'p1', quantity: 1, role: 'primary' },
              { product_id: 'memory', quantity: 1, role: 'component' },
            ],
          },
        ],
      },
      {
        id: 'memory',
        slug: 'microsd',
        name: 'MicroSD 64GB',
        model: 'SD64',
        description: 'Memoria',
        price: 1790,
        cash_price: 1790,
        card_price: 1990,
        stock_count: 2,
        stock_status: 'in_stock',
        is_active: true,
        packs: [],
      },
    ];
    const rawBody = JSON.stringify({ action: 'search', query: 'Kit Moto/Bici Pro', limit: 5 });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signMatchbotRequest('connector-secret', timestamp, rawBody);
    const response = await POST(
      new Request('https://povstore.uy/api/integrations/matchbot/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-matchbot-timestamp': timestamp,
          'x-matchbot-signature': signature,
        },
        body: rawBody,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toEqual([
      {
        id: 'p1::x200-moto-pro',
        name: 'Cámara POV X200 — Kit Moto/Bici Pro',
        model: 'X200',
        price: 13690,
        cash_price: 11990,
        card_price: 13690,
        stock_count: 2,
        stock_status: 'low_stock',
        url: 'https://povstore.uy/products/x200?pack=x200-moto-pro',
      },
    ]);
  });
});

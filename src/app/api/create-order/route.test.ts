import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentSupabase: any = null;

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    randomUUID: vi.fn(() => 'group-fixed-uuid'),
  };
});

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => currentSupabase),
}));

import { POST } from './route';
import { apiErrorMessages } from '@/messages/apiErrorMessages';

type ProductRow = {
  id: string;
  name: string;
  model?: string;
  price: number;
  cash_price: number | null;
  card_price: number | null;
  image_url?: string;
  stock_count: number;
  is_active: boolean;
  packs?: any;
};

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  idempotency_key?: string | null;
  idempotency_payload_hash?: string | null;
};

function makeSupabaseMock(params: {
  baseProducts: ProductRow[];
  componentProducts?: ProductRow[];
  existingOrders?: OrderRow[];
}) {
  const captures: {
    orderInsertPayload?: any;
    orderItemsInserted?: any[];
    orderItemsInsertCallCount: number;
    productQueryIds: string[][];
    orderInsertCallCount: number;
  } = {
    productQueryIds: [],
    orderItemsInsertCallCount: 0,
    orderInsertCallCount: 0,
  };

  let productQueryCount = 0;
  const ordersByIdempotency = new Map<string, OrderRow>();
  const seeded = params.existingOrders || [];
  for (const o of seeded) {
    if (o.idempotency_key) {
      ordersByIdempotency.set(o.idempotency_key, o);
    }
  }

  let orderSeq = seeded.length + 1;

  const supabase = {
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: (_sel: string) => ({
            in: async (_column: string, ids: string[]) => {
              captures.productQueryIds.push(ids);
              productQueryCount += 1;
              if (productQueryCount === 1) {
                return { data: params.baseProducts, error: null };
              }
              return { data: params.componentProducts || [], error: null };
            },
          }),
        };
      }

      if (table === 'orders') {
        return {
          select: (_sel: string) => ({
            eq: (_column: string, key: string) => ({
              maybeSingle: async () => ({
                data: ordersByIdempotency.get(key) || null,
                error: null,
              }),
            }),
          }),
          insert: (rows: any[]) => {
            captures.orderInsertCallCount += 1;
            captures.orderInsertPayload = rows?.[0];

            const key = String(captures.orderInsertPayload?.idempotency_key || '');
            if (key && ordersByIdempotency.has(key)) {
              return {
                select: (_sel: string) => ({
                  single: async () => ({
                    data: null,
                    error: { code: '23505', message: 'duplicate key value violates unique constraint' },
                  }),
                }),
              };
            }

            const inserted: OrderRow = {
              id: `order-${orderSeq++}`,
              order_number: captures.orderInsertPayload?.order_number || 'POV-000001',
              total: captures.orderInsertPayload?.total ?? 0,
              idempotency_key: captures.orderInsertPayload?.idempotency_key || null,
              idempotency_payload_hash: captures.orderInsertPayload?.idempotency_payload_hash || null,
            };

            if (inserted.idempotency_key) {
              ordersByIdempotency.set(inserted.idempotency_key, inserted);
            }

            return {
              select: (_sel: string) => ({
                single: async () => ({
                  data: {
                    id: inserted.id,
                    order_number: inserted.order_number,
                    total: inserted.total,
                    payment_status: 'pending',
                    order_status: 'pending',
                  },
                  error: null,
                }),
              }),
            };
          },
        };
      }

      if (table === 'order_items') {
        return {
          insert: async (rows: any[]) => {
            captures.orderItemsInsertCallCount += 1;
            captures.orderItemsInserted = rows;
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { supabase, captures, ordersByIdempotency };
}

function buildRequest(args: {
  items: any[];
  idempotencyKey?: string;
  paymentMethod?: 'mercadopago' | 'bank_transfer';
  deliveryMethod?: 'pickup' | 'delivery';
  customerInfo?: any;
}) {
  return new Request('http://localhost/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerInfo: args.customerInfo || {
        email: 'qa@example.com',
        fullName: 'QA User',
        phone: '099123456',
      },
      items: args.items,
      paymentMethod: args.paymentMethod || 'bank_transfer',
      deliveryMethod: args.deliveryMethod || 'pickup',
      ...(args.idempotencyKey !== undefined ? { idempotency_key: args.idempotencyKey } : {}),
    }),
  });
}

describe('create-order pack expansion + idempotency', () => {
  beforeEach(() => {
    currentSupabase = null;
  });

  it('creates order with only simple product line', async () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';

    const { supabase, captures } = makeSupabaseMock({
      baseProducts: [
        {
          id: simpleProductId,
          name: 'Simple Cam',
          model: 'SC-1',
          price: 1200,
          cash_price: 1000,
          card_price: 1200,
          image_url: 'simple.jpg',
          stock_count: 10,
          is_active: true,
          packs: [],
        },
      ],
    });
    currentSupabase = supabase;

    const res: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-simple-1',
        items: [{ type: 'product', product_id: simpleProductId, quantity: 2 }],
      }),
    );

    expect(res.status).toBe(200);
    expect(captures.orderItemsInserted).toHaveLength(1);
    expect(captures.orderItemsInserted?.[0]).toMatchObject({
      line_type: 'simple',
      quantity: 2,
      unit_price: 1000,
      total_price: 2000,
      pack_group_id: null,
      pack_id: null,
    });
    expect(captures.orderInsertPayload?.subtotal).toBe(2000);
  });

  it('creates order with one pack and uses same pack_group_id on all pack lines', async () => {
    const parentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const primaryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const componentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    const { supabase, captures } = makeSupabaseMock({
      baseProducts: [
        {
          id: parentId,
          name: 'Parent Product',
          model: 'PP-1',
          price: 5000,
          cash_price: 4500,
          card_price: 5000,
          image_url: 'parent.jpg',
          stock_count: 10,
          is_active: true,
          packs: [
            {
              id: 'pack-1',
              name: 'Starter Pack',
              price: 3000,
              cash_price: 2500,
              card_price: 3000,
              version: 2,
              images: ['pack.jpg'],
              components: [
                { product_id: primaryId, quantity: 1, role: 'primary' },
                { product_id: componentId, quantity: 2, role: 'component' },
              ],
            },
          ],
        },
      ],
      componentProducts: [
        {
          id: primaryId,
          name: 'Primary Item',
          model: 'PR-1',
          price: 1000,
          cash_price: null,
          card_price: null,
          image_url: 'primary.jpg',
          stock_count: 10,
          is_active: true,
        },
        {
          id: componentId,
          name: 'Component Item',
          model: 'CP-1',
          price: 500,
          cash_price: null,
          card_price: null,
          image_url: 'component.jpg',
          stock_count: 20,
          is_active: true,
        },
      ],
    });
    currentSupabase = supabase;

    const res: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-pack-1',
        items: [{ type: 'pack', parent_product_id: parentId, pack_id: 'pack-1', quantity: 1 }],
      }),
    );

    expect(res.status).toBe(200);
    const packPrimary = captures.orderItemsInserted?.find((x) => x.line_type === 'pack_primary');
    const packComponents = captures.orderItemsInserted?.filter((x) => x.line_type === 'pack_component') || [];

    expect(packPrimary).toBeTruthy();
    expect(packComponents.length).toBe(2);
    expect(packPrimary.pack_group_id).toBe('group-fixed-uuid');
    expect(packComponents.every((x) => x.pack_group_id === 'group-fixed-uuid')).toBe(true);
    expect(captures.orderInsertPayload?.subtotal).toBe(2500);
  });

  it('creates mixed order (simple + pack) and subtotal uses only simple + pack_primary', async () => {
    const simpleId = '11111111-1111-4111-8111-111111111111';
    const parentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const primaryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const componentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    const { supabase, captures } = makeSupabaseMock({
      baseProducts: [
        {
          id: simpleId,
          name: 'Simple Cam',
          model: 'SC-1',
          price: 1200,
          cash_price: 1000,
          card_price: 1200,
          image_url: 'simple.jpg',
          stock_count: 10,
          is_active: true,
          packs: [],
        },
        {
          id: parentId,
          name: 'Parent Product',
          model: 'PP-1',
          price: 5000,
          cash_price: 4500,
          card_price: 5000,
          image_url: 'parent.jpg',
          stock_count: 10,
          is_active: true,
          packs: [
            {
              id: 'pack-1',
              name: 'Starter Pack',
              price: 3000,
              cash_price: 2500,
              card_price: 3000,
              version: 1,
              images: ['pack.jpg'],
              components: [
                { product_id: primaryId, quantity: 1, role: 'primary' },
                { product_id: componentId, quantity: 2, role: 'component' },
              ],
            },
          ],
        },
      ],
      componentProducts: [
        {
          id: primaryId,
          name: 'Primary Item',
          model: 'PR-1',
          price: 1000,
          cash_price: null,
          card_price: null,
          image_url: 'primary.jpg',
          stock_count: 10,
          is_active: true,
        },
        {
          id: componentId,
          name: 'Component Item',
          model: 'CP-1',
          price: 500,
          cash_price: null,
          card_price: null,
          image_url: 'component.jpg',
          stock_count: 20,
          is_active: true,
        },
      ],
    });
    currentSupabase = supabase;

    const res: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-mixed-1',
        items: [
          { type: 'product', product_id: simpleId, quantity: 1 },
          { type: 'pack', parent_product_id: parentId, pack_id: 'pack-1', quantity: 1 },
        ],
      }),
    );

    expect(res.status).toBe(200);

    const hasSimple = captures.orderItemsInserted?.some((x) => x.line_type === 'simple');
    const hasPrimary = captures.orderItemsInserted?.some((x) => x.line_type === 'pack_primary');
    const hasComponent = captures.orderItemsInserted?.some((x) => x.line_type === 'pack_component');

    expect(hasSimple).toBe(true);
    expect(hasPrimary).toBe(true);
    expect(hasComponent).toBe(true);
    expect(captures.orderInsertPayload?.subtotal).toBe(3500); // 1000 (simple) + 2500 (pack_primary)
  });

  it('expands pack with multiple components preserving component quantities', async () => {
    const parentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const primaryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const compAId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const compBId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    const { supabase, captures } = makeSupabaseMock({
      baseProducts: [
        {
          id: parentId,
          name: 'Parent Product',
          model: 'PP-1',
          price: 5000,
          cash_price: 4500,
          card_price: 5000,
          image_url: 'parent.jpg',
          stock_count: 10,
          is_active: true,
          packs: [
            {
              id: 'pack-multi',
              name: 'Multi Pack',
              price: 4000,
              cash_price: 3200,
              card_price: 4000,
              version: 3,
              images: ['pack.jpg'],
              components: [
                { product_id: primaryId, quantity: 1, role: 'primary' },
                { product_id: compAId, quantity: 2, role: 'component' },
                { product_id: compBId, quantity: 3, role: 'component' },
              ],
            },
          ],
        },
      ],
      componentProducts: [
        { id: primaryId, name: 'Primary', price: 1, cash_price: null, card_price: null, stock_count: 50, is_active: true },
        { id: compAId, name: 'Comp A', price: 1, cash_price: null, card_price: null, stock_count: 50, is_active: true },
        { id: compBId, name: 'Comp B', price: 1, cash_price: null, card_price: null, stock_count: 50, is_active: true },
      ],
    });
    currentSupabase = supabase;

    const res: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-pack-multi',
        items: [{ type: 'pack', parent_product_id: parentId, pack_id: 'pack-multi', quantity: 2 }],
      }),
    );

    expect(res.status).toBe(200);

    const components = captures.orderItemsInserted?.filter((x) => x.line_type === 'pack_component') || [];
    expect(components).toHaveLength(3);

    const compA = components.find((x) => x.product_id === compAId);
    const compB = components.find((x) => x.product_id === compBId);

    expect(compA?.quantity).toBe(4); // 2 packs * 2
    expect(compB?.quantity).toBe(6); // 2 packs * 3
    expect(captures.orderInsertPayload?.subtotal).toBe(6400); // 3200 * 2 from pack_primary only
  });

  it('same idempotency_key + same logical payload returns same order without reinserting', async () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const { supabase, captures } = makeSupabaseMock({
      baseProducts: [
        {
          id: simpleProductId,
          name: 'Simple Cam',
          price: 1200,
          cash_price: 1000,
          card_price: 1200,
          stock_count: 10,
          is_active: true,
          packs: [],
        },
      ],
    });
    currentSupabase = supabase;

    const req = buildRequest({
      idempotencyKey: 'idem-retry-1',
      items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
    });

    const res1: any = await POST(req);
    const res2: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-retry-1',
        items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
      }),
    );

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res2.body.orderId).toBe(res1.body.orderId);
    expect(captures.orderInsertCallCount).toBe(1);
    expect(captures.orderItemsInsertCallCount).toBe(1);
  });

  it('same idempotency_key + different logical payload returns 409 conflict', async () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const { supabase } = makeSupabaseMock({
      baseProducts: [
        {
          id: simpleProductId,
          name: 'Simple Cam',
          price: 1200,
          cash_price: 1000,
          card_price: 1200,
          stock_count: 10,
          is_active: true,
          packs: [],
        },
      ],
    });
    currentSupabase = supabase;

    const res1: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-conflict-1',
        items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
      }),
    );
    const res2: any = await POST(
      buildRequest({
        idempotencyKey: 'idem-conflict-1',
        items: [{ type: 'product', product_id: simpleProductId, quantity: 2 }],
      }),
    );

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe(apiErrorMessages.createOrder.idempotencyConflict);
  });

  it('missing or invalid idempotency_key returns 400', async () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const { supabase } = makeSupabaseMock({
      baseProducts: [
        {
          id: simpleProductId,
          name: 'Simple Cam',
          price: 1200,
          cash_price: 1000,
          card_price: 1200,
          stock_count: 10,
          is_active: true,
          packs: [],
        },
      ],
    });
    currentSupabase = supabase;

    const missingKeyRes: any = await POST(
      buildRequest({
        items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        idempotencyKey: undefined,
      }),
    );

    const invalidKeyRes: any = await POST(
      buildRequest({
        idempotencyKey: 'x'.repeat(129),
        items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
      }),
    );

    expect(missingKeyRes.status).toBe(400);
    expect(invalidKeyRes.status).toBe(400);
  });
});

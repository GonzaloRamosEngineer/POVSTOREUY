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

  const supabase: any = {
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
        // Solo para el pre-check de idempotencia. Los inserts ahora van por RPC.
        return {
          select: (_sel: string) => ({
            eq: (_column: string, key: string) => ({
              maybeSingle: async () => ({
                data: ordersByIdempotency.get(key) || null,
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    // PF-05: el handler ahora llama a la RPC create_order_transactional.
    // Este mock simula su contrato: orders + order_items atómicos, con status para idempotencia.
    rpc: async (name: string, args: any) => {
      if (name !== 'create_order_transactional') {
        throw new Error(`Unexpected RPC: ${name}`);
      }

      captures.orderInsertCallCount += 1;
      // Mapeamos los args de la RPC al shape plano que esperan los tests.
      captures.orderInsertPayload = {
        order_number: args.p_order_number,
        customer_email: args.p_customer_email,
        customer_name: args.p_customer_name,
        customer_phone: args.p_customer_phone,
        shipping_address: args.p_shipping_address,
        shipping_city: args.p_shipping_city,
        shipping_department: args.p_shipping_department,
        shipping_postal_code: args.p_shipping_postal_code,
        subtotal: args.p_subtotal,
        shipping_cost: args.p_shipping_cost,
        total: args.p_total,
        payment_method: args.p_payment_method,
        notes: args.p_notes,
        idempotency_key: args.p_idempotency_key,
        idempotency_payload_hash: args.p_idempotency_payload_hash,
        delivery_method: args.p_delivery_method,
      };

      captures.orderItemsInsertCallCount += 1;
      captures.orderItemsInserted = args.p_items;

      const key = String(args.p_idempotency_key || '');
      const hash = String(args.p_idempotency_payload_hash || '');

      const existing = ordersByIdempotency.get(key);
      if (existing) {
        const existingHash = String(existing.idempotency_payload_hash || '');
        if (existingHash !== hash) {
          return {
            data: [{
              order_id: existing.id,
              order_number: existing.order_number,
              total: existing.total,
              status: 'payload_mismatch',
            }],
            error: null,
          };
        }
        return {
          data: [{
            order_id: existing.id,
            order_number: existing.order_number,
            total: existing.total,
            status: 'idempotent_replay',
          }],
          error: null,
        };
      }

      const inserted: OrderRow = {
        id: `order-${orderSeq++}`,
        order_number: args.p_order_number || 'POV-000001',
        total: args.p_total ?? 0,
        idempotency_key: key,
        idempotency_payload_hash: hash,
      };
      ordersByIdempotency.set(key, inserted);

      return {
        data: [{
          order_id: inserted.id,
          order_number: inserted.order_number,
          total: inserted.total,
          status: 'created',
        }],
        error: null,
      };
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
  expectedTotal?: number;
  strictPricing?: boolean;
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
      ...(args.expectedTotal !== undefined ? { expectedTotal: args.expectedTotal } : {}),
      ...(args.strictPricing !== undefined ? { strictPricing: args.strictPricing } : {}),
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

  // PF-06: price drift detection
  describe('price drift detection (PF-06)', () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const simpleProductRow = {
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
    };

    it('omits priceDrift in response when no expectedTotal is sent (backwards compat)', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-drift-control',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        }),
      );

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.total).toBe(1000);
      expect(res.body.priceDrift).toBeUndefined();
    });

    it('omits priceDrift when expectedTotal matches computed total', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-drift-match',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          expectedTotal: 1000,
        }),
      );

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1000);
      expect(res.body.priceDrift).toBeUndefined();
    });

    it('includes priceDrift in 200 response when expectedTotal mismatches and strictPricing is not set (informational mode)', async () => {
      const { supabase, captures } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-drift-info',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          expectedTotal: 950,
        }),
      );

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.total).toBe(1000);
      expect(res.body.priceDrift).toEqual({ expected: 950, computed: 1000, diff: 50 });
      // Confirma que la orden SÍ se creó en modo informativo
      expect(captures.orderInsertCallCount).toBe(1);
      expect(captures.orderItemsInsertCallCount).toBe(1);
    });

    it('rejects with 409 + priceDrift when mismatch and strictPricing=true, without creating order (enterprise mode)', async () => {
      const { supabase, captures } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-drift-strict',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          expectedTotal: 950,
          strictPricing: true,
        }),
      );

      expect(res.status).toBe(409);
      expect(res.body.error).toBe(apiErrorMessages.createOrder.priceDriftRejected);
      expect(res.body.priceDrift).toEqual({ expected: 950, computed: 1000, diff: 50 });
      // Confirma que NO se creó la orden cuando se rechaza
      expect(captures.orderInsertCallCount).toBe(0);
      expect(captures.orderItemsInsertCallCount).toBe(0);
    });
  });

  // PF-05: contrato de la RPC create_order_transactional
  describe('RPC create_order_transactional (PF-05)', () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const simpleProductRow: ProductRow = {
      id: simpleProductId,
      name: 'Simple Cam',
      price: 1200,
      cash_price: 1000,
      card_price: 1200,
      stock_count: 10,
      is_active: true,
      packs: [],
    };

    it('returns 500 when the RPC returns a DB error', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      supabase.rpc = async () => ({
        data: null,
        error: { code: 'XX000', message: 'simulated DB failure' },
      });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-rpc-err',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        }),
      );

      expect(res.status).toBe(500);
      expect(res.body.error).toBe(apiErrorMessages.createOrder.orderCreationFailed);
    });

    it('returns 500 when the RPC returns an empty/null result row', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      supabase.rpc = async () => ({ data: [], error: null });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-rpc-empty',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        }),
      );

      expect(res.status).toBe(500);
      expect(res.body.error).toBe(apiErrorMessages.createOrder.orderCreationFailed);
    });

    it('returns 409 when the RPC reports payload_mismatch (bypass of pre-check)', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      supabase.rpc = async () => ({
        data: [{
          order_id: 'pre-existing-id',
          order_number: 'POV-999999',
          total: 1234,
          status: 'payload_mismatch',
        }],
        error: null,
      });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-rpc-mismatch',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        }),
      );

      expect(res.status).toBe(409);
      expect(res.body.error).toBe(apiErrorMessages.createOrder.idempotencyConflict);
    });

    it('returns 200 with the existing order when the RPC reports idempotent_replay', async () => {
      const { supabase } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      supabase.rpc = async () => ({
        data: [{
          order_id: 'replay-id',
          order_number: 'POV-111111',
          total: 1000,
          status: 'idempotent_replay',
        }],
        error: null,
      });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-rpc-replay',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
        }),
      );

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.orderId).toBe('replay-id');
      expect(res.body.orderNumber).toBe('POV-111111');
      expect(res.body.total).toBe(1000);
    });
  });

  // PF-09: el handler debe pasar deliveryMethod a la RPC como p_delivery_method.
  describe('PF-09: p_delivery_method passthrough', () => {
    const simpleProductId = '11111111-1111-4111-8111-111111111111';
    const simpleProductRow: ProductRow = {
      id: simpleProductId,
      name: 'Simple Cam',
      price: 1200,
      cash_price: 1000,
      card_price: 1200,
      stock_count: 10,
      is_active: true,
      packs: [],
    };

    const deliveryCustomerInfo = {
      email: 'qa@example.com',
      fullName: 'QA User',
      phone: '099123456',
      address: 'Calle Falsa 123',
      city: 'Montevideo',
      department: 'Montevideo',
      postalCode: '11200',
    };

    it('passes p_delivery_method="delivery" when deliveryMethod=delivery', async () => {
      const { supabase, captures } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-dm-delivery',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'mercadopago',
          customerInfo: deliveryCustomerInfo,
        }),
      );

      expect(res.status).toBe(200);
      expect(captures.orderInsertPayload?.delivery_method).toBe('delivery');
    });

    it('passes p_delivery_method="pickup" when deliveryMethod=pickup', async () => {
      const { supabase, captures } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-dm-pickup',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'mercadopago',
        }),
      );

      expect(res.status).toBe(200);
      expect(captures.orderInsertPayload?.delivery_method).toBe('pickup');
    });

    it('defaults to "delivery" when deliveryMethod is missing or unknown', async () => {
      const { supabase, captures } = makeSupabaseMock({ baseProducts: [simpleProductRow] });
      currentSupabase = supabase;

      const res: any = await POST(
        buildRequest({
          idempotencyKey: 'idem-dm-default',
          items: [{ type: 'product', product_id: simpleProductId, quantity: 1 }],
          // El normalizador del handler: dm = deliveryMethod === 'pickup' ? 'pickup' : 'delivery'.
          deliveryMethod: 'whatever' as any,
          paymentMethod: 'mercadopago',
          customerInfo: deliveryCustomerInfo,
        }),
      );

      expect(res.status).toBe(200);
      expect(captures.orderInsertPayload?.delivery_method).toBe('delivery');
    });
  });
});

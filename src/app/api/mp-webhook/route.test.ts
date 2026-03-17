import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentSupabase: any = null;
let currentPayment: any = null;

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => currentSupabase),
}));

import { POST } from './route';

type OrderRow = {
  id: string;
  payment_status: 'pending' | 'completed' | 'failed';
  order_status: 'pending' | 'processing' | 'cancelled';
  stock_applied_at?: string | null;
};

function makeSupabaseMock(initialOrder: OrderRow) {
  const stockByProduct = new Map<string, number>([['p1', 10]]);
  const state = {
    order: { ...initialOrder },
    orderUpdates: [] as any[],
    productUpdates: [] as any[],
    orderItems: [{ product_id: 'p1', quantity: 2 }],
  };

  const supabase = {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: (_sel: string) => ({
            eq: (_column: string, _value: string) => ({
              single: async () => ({ data: state.order, error: null }),
            }),
          }),
          update: (payload: any) => ({
            eq: async (_column: string, _value: string) => {
              state.orderUpdates.push(payload);
              state.order = { ...state.order, ...payload };
              return { error: null };
            },
          }),
        };
      }

      if (table === 'order_items') {
        return {
          select: (_sel: string) => ({
            eq: async (_column: string, _value: string) => ({ data: state.orderItems, error: null }),
          }),
        };
      }

      if (table === 'products') {
        return {
          select: (_sel: string) => ({
            eq: (_column: string, id: string) => ({
              single: async () => ({ data: { stock_count: stockByProduct.get(id) ?? 0 }, error: null }),
            }),
          }),
          update: (payload: any) => ({
            eq: async (_column: string, id: string) => {
              state.productUpdates.push({ id, payload });
              stockByProduct.set(id, payload.stock_count);
              return { error: null };
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { supabase, state, stockByProduct };
}

function buildWebhookRequest(paymentId: string) {
  return new Request(`http://localhost/api/mp-webhook?topic=payment&id=${paymentId}`, {
    method: 'POST',
  });
}

describe('mp-webhook stage 3.3A stock apply once', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentSupabase = null;
    currentPayment = null;
    process.env.MP_ACCESS_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => currentPayment,
      })) as any,
    );
  });

  it('approved valid transition applies stock once', async () => {
    const { supabase, state, stockByProduct } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'approved',
      status_detail: 'accredited',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(state.productUpdates).toHaveLength(1);
    expect(stockByProduct.get('p1')).toBe(8);
    expect(state.order.stock_applied_at).toBeTruthy();
  });

  it('approved repeated does not apply stock again', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'approved',
      status_detail: 'accredited',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.productUpdates).toHaveLength(0);
  });

  it('approved with existing stock_applied_at does not discount again', async () => {
    const { supabase, state, stockByProduct } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'approved',
      status_detail: 'accredited',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.productUpdates).toHaveLength(0);
    expect(stockByProduct.get('p1')).toBe(10);
  });

  it('failed/cancelled valid transition does not apply stock', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'cancelled',
      status_detail: 'by_collector',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(state.productUpdates).toHaveLength(0);
  });
});

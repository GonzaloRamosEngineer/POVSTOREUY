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

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => currentSupabase),
}));

import { PATCH } from './route';

type OrderRow = {
  id: string;
  order_number: string;
  order_status: 'pending' | 'processing' | 'ready' | 'shipped' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: 'bank_transfer' | 'mercadopago';
  stock_applied_at?: string | null;
  shipping_address?: string | null;
  tracking_number?: string | null;
  payment_id?: string | null;
  mp_status?: string | null;
};

function makeSupabaseMock(initialOrder: OrderRow) {
  const stockByProduct = new Map<string, number>([['p1', 10]]);
  const state = {
    order: { ...initialOrder },
    orderItems: [{ product_id: 'p1', quantity: 2 }],
    orderUpdates: [] as any[],
    productUpdates: [] as any[],
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
            eq: (_column: string, _value: string) => {
              state.orderUpdates.push(payload);
              state.order = { ...state.order, ...payload };
              return {
                error: null,
                select: () => ({
                  single: async () => ({ data: state.order, error: null }),
                }),
              };
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

function buildPatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/orders/POV-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('admin orders PATCH - stage 3.3A stock apply once', () => {
  beforeEach(() => {
    currentSupabase = null;
  });

  it('manual bank_transfer confirmation applies stock once', async () => {
    const { supabase, state, stockByProduct } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'pending',
      payment_method: 'bank_transfer',
      stock_applied_at: null,
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(state.productUpdates).toHaveLength(1);
    expect(stockByProduct.get('p1')).toBe(8);
    expect(state.order.stock_applied_at).toBeTruthy();
  });

  it('manual confirmation repeated is no-op and does not apply stock again', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.productUpdates).toHaveLength(0);
  });

  it('manual confirmation with existing stock_applied_at does not discount again', async () => {
    const { supabase, state, stockByProduct } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'pending',
      payment_method: 'bank_transfer',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(state.productUpdates).toHaveLength(0);
    expect(stockByProduct.get('p1')).toBe(10);
  });
});

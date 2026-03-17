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
  order_status: string;
  payment_status: string;
  payment_method: 'bank_transfer' | 'mercadopago';
  stock_applied_at: string | null;
  shipping_address?: string | null;
  tracking_number?: string | null;
};

function makeSupabaseMock(initialOrder: OrderRow) {
  const state = {
    order: { ...initialOrder },
    orderUpdates: [] as any[],
    rpcCalls: 0,
    stockAppliedCount: 0,
  };

  const supabase = {
    from: (table: string) => {
      if (table !== 'orders') throw new Error(`Unexpected table: ${table}`);

      return {
        select: (_sel: string) => ({
          eq: (_column: string, _value: string) => ({
            single: async () => ({ data: state.order, error: null }),
          }),
        }),
        update: (payload: any) => ({
          eq: (_column: string, _value: string) => ({
            select: () => ({
              single: async () => {
                state.orderUpdates.push(payload);
                state.order = { ...state.order, ...payload };
                return { data: state.order, error: null };
              },
            }),
          }),
        }),
      };
    },
    rpc: async (fn: string, _args: any) => {
      if (fn !== 'apply_order_stock_once') throw new Error(`Unexpected rpc: ${fn}`);
      state.rpcCalls += 1;

      if (state.order.stock_applied_at) {
        return { data: [{ ok: true, no_op: true, reason: 'stock_already_applied' }], error: null };
      }

      state.stockAppliedCount += 1;
      state.order.stock_applied_at = '2026-03-17T00:00:00.000Z';
      return { data: [{ ok: true, no_op: false, reason: 'stock_applied' }], error: null };
    },
  };

  return { supabase, state };
}

function buildPatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/orders/POV-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('admin orders PATCH stage 3.3A', () => {
  beforeEach(() => {
    currentSupabase = null;
  });

  it('manual bank_transfer confirmation applies stock once', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'pending',
      payment_method: 'bank_transfer',
      stock_applied_at: null,
      shipping_address: 'Street',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(state.rpcCalls).toBe(1);
    expect(state.stockAppliedCount).toBe(1);
  });

  it('manual repeat with stock already applied does not reapply', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
      shipping_address: 'Street',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.rpcCalls).toBe(1);
    expect(state.stockAppliedCount).toBe(0);
  });

  it('recoverable: completed with stock_applied_at null applies stock on retry', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      stock_applied_at: null,
      shipping_address: 'Street',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(state.rpcCalls).toBe(1);
    expect(state.stockAppliedCount).toBe(1);
  });
});

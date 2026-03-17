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
  stock_applied_at: string | null;
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
          eq: async (_column: string, _value: string) => {
            state.orderUpdates.push(payload);
            state.order = { ...state.order, ...payload };
            return { error: null };
          },
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

function buildWebhookRequest(paymentId: string) {
  return new Request(`http://localhost/api/mp-webhook?topic=payment&id=${paymentId}`, {
    method: 'POST',
  });
}

describe('mp-webhook stage 3.3A corrected', () => {
  beforeEach(() => {
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

  it('approved pending + stock_applied_at null applies stock once', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(state.orderUpdates).toHaveLength(1);
    expect(state.rpcCalls).toBe(1);
    expect(state.stockAppliedCount).toBe(1);
  });

  it('approved retry with completed + stock_applied_at set is no-op', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
    });
    currentSupabase = supabase;
    currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.rpcCalls).toBe(0);
    expect(state.stockAppliedCount).toBe(0);
  });

  it('recoverable: completed + stock_applied_at null applies stock on approved retry', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(state.orderUpdates).toHaveLength(0);
    expect(state.rpcCalls).toBe(1);
    expect(state.stockAppliedCount).toBe(1);
  });

  it('failed/cancelled does not apply stock', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = { status: 'cancelled', status_detail: 'by_collector', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(state.rpcCalls).toBe(0);
  });

  it('invalid transition completed -> failed returns 409', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
      stock_applied_at: '2026-03-17T00:00:00.000Z',
    });
    currentSupabase = supabase;
    currentPayment = { status: 'cancelled', status_detail: 'by_collector', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(409);
    expect(state.rpcCalls).toBe(0);
  });
});

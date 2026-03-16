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
};

function makeSupabaseMock(initialOrder: OrderRow) {
  const state = {
    order: { ...initialOrder },
    updates: [] as any[],
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
              state.updates.push(payload);
              state.order = { ...state.order, ...payload };
              return { error: null };
            },
          }),
        };
      }

      if (table === 'order_items') {
        return {
          select: (_sel: string) => ({
            eq: async (_column: string, _value: string) => ({ data: [], error: null }),
          }),
        };
      }

      if (table === 'products') {
        return {
          select: (_sel: string) => ({
            eq: (_column: string, _value: string) => ({
              single: async () => ({ data: { stock_count: 10 }, error: null }),
            }),
          }),
          update: (_payload: any) => ({
            eq: async (_column: string, _value: string) => ({ error: null }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { supabase, state };
}

function buildWebhookRequest(paymentId: string) {
  return new Request(`http://localhost/api/mp-webhook?topic=payment&id=${paymentId}`, {
    method: 'POST',
  });
}

describe('mp-webhook stage 3.2B minimal idempotency guards', () => {
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

  it('approved valid transition updates order', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
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
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({
      payment_status: 'completed',
      order_status: 'processing',
      payment_id: 'pay-1',
      mp_status: 'approved',
    });
  });

  it('approved repeated over completed is safe no-op', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
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
    expect(state.updates).toHaveLength(0);
  });

  it('failed/cancelled valid transition updates order', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
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
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({
      payment_status: 'failed',
      order_status: 'cancelled',
      mp_status: 'cancelled',
    });
  });

  it('failed/cancelled repeated over failed is safe no-op', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'failed',
      order_status: 'cancelled',
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'rejected',
      status_detail: 'cc_rejected',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.updates).toHaveLength(0);
  });

  it('invalid transition (completed -> failed) returns 409', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'completed',
      order_status: 'processing',
    });
    currentSupabase = supabase;
    currentPayment = {
      status: 'cancelled',
      status_detail: 'by_collector',
      external_reference: 'order-1',
      metadata: {},
    };

    const res: any = await POST(buildWebhookRequest('pay-1'));

    expect(res.status).toBe(409);
    expect(state.updates).toHaveLength(0);
  });
});

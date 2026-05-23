import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = 'test-webhook-secret';

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

function signManifest(dataId: string, requestId: string, tsSeconds: number) {
  const normalized = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${normalized};request-id:${requestId};ts:${tsSeconds};`;
  return createHmac('sha256', WEBHOOK_SECRET).update(manifest).digest('hex');
}

function buildWebhookRequest(
  paymentId: string,
  opts?: { skipSignature?: boolean; tamper?: boolean; tsOverride?: number }
) {
  const requestId = 'req-uuid-test';
  const ts = opts?.tsOverride ?? Math.floor(Date.now() / 1000);
  const headers: Record<string, string> = {};
  if (!opts?.skipSignature) {
    const v1 = signManifest(paymentId, requestId, ts);
    const finalV1 = opts?.tamper ? v1.slice(0, -2) + (v1.endsWith('aa') ? 'bb' : 'aa') : v1;
    headers['x-signature'] = `ts=${ts},v1=${finalV1}`;
    headers['x-request-id'] = requestId;
  }
  return new Request(`http://localhost/api/mp-webhook?topic=payment&id=${paymentId}`, {
    method: 'POST',
    headers,
  });
}

describe('mp-webhook stage 3.3A corrected', () => {
  beforeEach(() => {
    currentSupabase = null;
    currentPayment = null;
    process.env.MP_ACCESS_TOKEN = 'test-token';
    process.env.MP_WEBHOOK_SECRET = WEBHOOK_SECRET;

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

  it('approved repeated with stock_applied_at set is no-op', async () => {
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
  });

  it('completed + stock_applied_at null uses recovery path and applies stock', async () => {
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

  it('invalid transition returns 409', async () => {
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

  it('rejects request without x-signature header with 401', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1', { skipSignature: true }));

    expect(res.status).toBe(401);
    expect(state.rpcCalls).toBe(0);
    expect(state.orderUpdates.length).toBe(0);
  });

  it('rejects request with tampered v1 signature with 401', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'order-1',
      payment_status: 'pending',
      order_status: 'pending',
      stock_applied_at: null,
    });
    currentSupabase = supabase;
    currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

    const res: any = await POST(buildWebhookRequest('pay-1', { tamper: true }));

    expect(res.status).toBe(401);
    expect(state.rpcCalls).toBe(0);
    expect(state.orderUpdates.length).toBe(0);
  });

  // PF-04: webhook error handling
  describe('error handling (PF-04)', () => {
    it('returns 200 with order_not_found reason when order does not exist in DB', async () => {
      const supabase = {
        from: (_table: string) => ({
          select: (_sel: string) => ({
            eq: (_col: string, _val: string) => ({
              single: async () => ({ data: null, error: { message: 'not found' } }),
            }),
          }),
        }),
        rpc: async () => ({ data: [], error: null }),
      };
      currentSupabase = supabase;
      currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'nonexistent-order', metadata: {} };

      const res: any = await POST(buildWebhookRequest('pay-1'));

      expect(res.status).toBe(200);
      expect(res.body.reason).toBe('order_not_found');
    });

    it('returns 500 when DB update fails so MP retries', async () => {
      // Mock where select succeeds pero update devuelve error
      const supabase = {
        from: (_table: string) => ({
          select: (_sel: string) => ({
            eq: (_col: string, _val: string) => ({
              single: async () => ({
                data: {
                  id: 'order-1',
                  payment_status: 'pending',
                  stock_applied_at: null,
                },
                error: null,
              }),
            }),
          }),
          update: (_payload: any) => ({
            eq: async (_col: string, _val: string) => ({
              error: { message: 'transient DB error' },
            }),
          }),
        }),
        rpc: async () => ({ data: [], error: null }),
      };
      currentSupabase = supabase;
      currentPayment = { status: 'approved', status_detail: 'accredited', external_reference: 'order-1', metadata: {} };

      const res: any = await POST(buildWebhookRequest('pay-1'));

      expect(res.status).toBe(500);
      expect(res.body.ok).toBe(false);
    });

    it('returns 500 when handler throws (unhandled exception) so MP retries', async () => {
      // Hacemos que mpGetPayment falle haciéndo throw en fetch
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('network broken');
        }) as any,
      );

      const { supabase } = makeSupabaseMock({
        id: 'order-1',
        payment_status: 'pending',
        order_status: 'pending',
        stock_applied_at: null,
      });
      currentSupabase = supabase;
      // currentPayment no se va a usar porque fetch throwea antes

      const res: any = await POST(buildWebhookRequest('pay-1'));

      expect(res.status).toBe(500);
      expect(res.body.ok).toBe(false);
    });
  });
});

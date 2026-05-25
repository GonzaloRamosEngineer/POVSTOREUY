import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiErrorMessages } from '@/messages/apiErrorMessages';

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

vi.mock('@/lib/rateLimit/apply', () => ({
  applyRateLimit: vi.fn(async () => ({ blockedResponse: null })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/rateLimit/limiters', () => ({
  getMpPreferenceLimiter: vi.fn(() => null),
}));

import { POST } from './route';

type OrderRow = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  order_status: 'pending' | 'processing' | 'ready' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  shipping_cost: number;
  mp_preference_id: string | null;
};

function makeSupabaseMock(order: OrderRow, opts?: { items?: any[] }) {
  const state = {
    order: { ...order },
    orderUpdates: [] as any[],
  };

  const items = opts?.items ?? [
    { line_type: 'simple', product_name: 'Camera POV', product_model: '4K', quantity: 1, unit_price: 1500 },
  ];

  const supabase = {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: (_sel: string) => ({
            eq: (_col: string, _val: string) => ({
              single: async () => ({ data: state.order, error: null }),
            }),
          }),
          update: (payload: any) => ({
            eq: async (_col: string, _val: string) => {
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
            eq: (_col: string, _val: string) => Promise.resolve({ data: items, error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { supabase, state };
}

function buildRequest(orderId: string) {
  return new Request('http://localhost/api/mp-preference', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

const baseOrder: OrderRow = {
  id: 'order-1',
  order_number: 'POV-123456',
  customer_email: 'buyer@example.com',
  customer_name: 'Buyer',
  payment_method: 'mercadopago',
  payment_status: 'pending',
  order_status: 'pending',
  total: 1500,
  shipping_cost: 0,
  mp_preference_id: null,
};

describe('mp-preference state guard (PF-07)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    currentSupabase = null;
    process.env.MP_ACCESS_TOKEN = 'test-token';
    process.env.ORDER_LOOKUP_SECRET = 'a'.repeat(64);
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:4028';

    fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'mp-pref-123',
        init_point: 'https://mp.example/init',
        sandbox_init_point: 'https://mp.example/sandbox',
      }),
    }));
    vi.stubGlobal('fetch', fetchMock as any);
  });

  it('rejects with 409 when payment_status="completed"', async () => {
    const { supabase, state } = makeSupabaseMock({ ...baseOrder, payment_status: 'completed' });
    currentSupabase = supabase;

    const res: any = await POST(buildRequest('order-1'));

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(apiErrorMessages.mpPreference.orderAlreadyPaid);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.orderUpdates).toHaveLength(0);
  });

  it('rejects with 409 when payment_status="refunded"', async () => {
    const { supabase, state } = makeSupabaseMock({ ...baseOrder, payment_status: 'refunded' });
    currentSupabase = supabase;

    const res: any = await POST(buildRequest('order-1'));

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(apiErrorMessages.mpPreference.orderRefunded);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.orderUpdates).toHaveLength(0);
  });

  it('rejects with 409 when order_status="cancelled"', async () => {
    const { supabase, state } = makeSupabaseMock({
      ...baseOrder,
      payment_status: 'pending',
      order_status: 'cancelled',
    });
    currentSupabase = supabase;

    const res: any = await POST(buildRequest('order-1'));

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(apiErrorMessages.mpPreference.orderCancelled);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.orderUpdates).toHaveLength(0);
  });

  it('allows retry (200) when payment_status="failed"', async () => {
    const { supabase, state } = makeSupabaseMock({ ...baseOrder, payment_status: 'failed' });
    currentSupabase = supabase;

    const res: any = await POST(buildRequest('order-1'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.preferenceId).toBe('mp-pref-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // El handler persiste el preference_id en la orden tras crear la preference
    expect(state.orderUpdates).toHaveLength(1);
    expect(state.orderUpdates[0].mp_preference_id).toBe('mp-pref-123');
  });

  it('happy path (200) with pending/pending order', async () => {
    const { supabase } = makeSupabaseMock(baseOrder);
    currentSupabase = supabase;

    const res: any = await POST(buildRequest('order-1'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.orderId).toBe('order-1');
    expect(res.body.preferenceId).toBe('mp-pref-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

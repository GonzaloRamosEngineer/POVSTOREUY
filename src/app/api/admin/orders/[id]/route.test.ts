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
  shipping_address?: string | null;
  tracking_number?: string | null;
  payment_id?: string | null;
  mp_status?: string | null;
};

function makeSupabaseMock(initialOrder: OrderRow) {
  const state = {
    order: { ...initialOrder },
    updates: [] as any[],
  };

  const supabase = {
    from: (table: string) => {
      if (table !== 'orders') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: (_sel: string) => ({
          eq: (_column: string, _value: string) => ({
            single: async () => ({ data: state.order, error: null }),
          }),
        }),
        update: (payload: any) => {
          state.updates.push(payload);
          state.order = { ...state.order, ...payload };

          return {
            eq: (_column: string, _value: string) => ({
              select: () => ({
                single: async () => ({ data: state.order, error: null }),
              }),
            }),
          };
        },
      };
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

describe('admin orders PATCH - stage 3.2A manual transition guards', () => {
  beforeEach(() => {
    currentSupabase = null;
  });

  it('manual payment confirmation is valid from pending (bank transfer)', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'pending',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.payment_status).toBe('completed');
    expect(res.body.order_status).toBe('processing');
    expect(state.updates).toHaveLength(1);
  });

  it('manual payment confirmation repeated is safe no-op', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.updates).toHaveLength(0);
  });

  it('manual payment confirmation from invalid origin returns 409', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'failed',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ payment_status: 'completed' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(409);
    expect(state.updates).toHaveLength(0);
  });

  it('manual cancellation is valid from pending/processing/ready/shipped', async () => {
    for (const sourceStatus of ['pending', 'processing', 'ready', 'shipped'] as const) {
      const { supabase, state } = makeSupabaseMock({
        id: 'o1',
        order_number: 'POV-1',
        order_status: sourceStatus,
        payment_status: 'pending',
        payment_method: 'bank_transfer',
        shipping_address: 'Street 123',
      });
      currentSupabase = supabase;

      const res: any = await PATCH(buildPatchRequest({ status: 'cancelled' }) as any, {
        params: Promise.resolve({ id: 'POV-1' }),
      });

      expect(res.status).toBe(200);
      expect(res.body.order_status).toBe('cancelled');
      expect(res.body.payment_status).toBe('failed');
      expect(state.updates).toHaveLength(1);
    }
  });

  it('manual cancellation repeated over cancelled is safe no-op', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'cancelled',
      payment_status: 'failed',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ status: 'cancelled' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.no_op).toBe(true);
    expect(state.updates).toHaveLength(0);
  });

  it('manual cancellation from completed returns 409', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'completed',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ status: 'cancelled' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(409);
    expect(state.updates).toHaveLength(0);
  });

  it('manual cancellation sets payment_status failed only when it was pending', async () => {
    const { supabase, state } = makeSupabaseMock({
      id: 'o1',
      order_number: 'POV-1',
      order_status: 'processing',
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      shipping_address: 'Street 123',
    });
    currentSupabase = supabase;

    const res: any = await PATCH(buildPatchRequest({ status: 'cancelled' }) as any, {
      params: Promise.resolve({ id: 'POV-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.order_status).toBe('cancelled');
    expect(res.body.payment_status).toBe('completed');
    expect(state.updates[0].payment_status).toBeUndefined();
  });
});

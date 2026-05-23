import { describe, expect, it } from 'vitest';
import { applyOrderStockOnce } from './applyOrderStockOnce';

function makeSupabase(rpcResult: any) {
  return {
    rpc: async (_fn: string, _args: any) => rpcResult,
  };
}

describe('applyOrderStockOnce wrapper', () => {
  it('returns {ok:true, no_op:false, reason:"stock_applied"} on happy path', async () => {
    const supabase = makeSupabase({
      data: [{ ok: true, no_op: false, reason: 'stock_applied' }],
      error: null,
    });
    const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
    expect(res).toEqual({ ok: true, no_op: false, reason: 'stock_applied' });
  });

  it('returns {no_op:true, reason:"stock_already_applied"} on idempotent replay', async () => {
    const supabase = makeSupabase({
      data: [{ ok: true, no_op: true, reason: 'stock_already_applied' }],
      error: null,
    });
    const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
    expect(res.ok).toBe(true);
    expect(res.no_op).toBe(true);
    expect(res.reason).toBe('stock_already_applied');
  });

  it('returns {ok:false, reason:"order_not_found"} for missing order', async () => {
    const supabase = makeSupabase({
      data: [{ ok: false, no_op: false, reason: 'order_not_found' }],
      error: null,
    });
    const res = await applyOrderStockOnce({ supabase, orderId: 'missing' });
    expect(res).toEqual({ ok: false, no_op: false, reason: 'order_not_found' });
  });

  // Race condition fix: la RPC ahora hace RAISE EXCEPTION cuando hay shortfall.
  describe('insufficient_stock parsing', () => {
    it('detects insufficient_stock error and parses DETAIL into shortfall', async () => {
      const supabase = makeSupabase({
        data: null,
        error: {
          message: 'insufficient_stock',
          details: 'product_id=abc-123 name=Camera POV 4K available=0 needed=3',
        },
      });
      const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('insufficient_stock');
      expect(res.shortfall).toEqual({
        productId: 'abc-123',
        name: 'Camera POV 4K',
        available: 0,
        needed: 3,
      });
    });

    it('also accepts `detail` (singular) key — Supabase JS varies by version', async () => {
      const supabase = makeSupabase({
        data: null,
        error: {
          message: 'insufficient_stock',
          detail: 'product_id=xyz name=Pack Combo available=1 needed=5',
        },
      });
      const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
      expect(res.reason).toBe('insufficient_stock');
      expect(res.shortfall?.productId).toBe('xyz');
      expect(res.shortfall?.needed).toBe(5);
    });

    it('returns insufficient_stock without shortfall when DETAIL is malformed', async () => {
      const supabase = makeSupabase({
        data: null,
        error: {
          message: 'insufficient_stock',
          details: 'garbage that does not match pattern',
        },
      });
      const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('insufficient_stock');
      expect(res.shortfall).toBeUndefined();
    });
  });

  it('returns generic error for non-insufficient_stock DB errors', async () => {
    const supabase = makeSupabase({
      data: null,
      error: { message: 'connection refused' },
    });
    const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('connection refused');
    expect(res.shortfall).toBeUndefined();
  });

  it('returns empty_rpc_response when data is null/empty without error', async () => {
    const supabase = makeSupabase({ data: [], error: null });
    const res = await applyOrderStockOnce({ supabase, orderId: 'o1' });
    expect(res).toEqual({ ok: false, no_op: false, reason: 'empty_rpc_response' });
  });
});

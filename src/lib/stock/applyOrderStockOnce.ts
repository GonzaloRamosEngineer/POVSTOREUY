export async function applyOrderStockOnce(params: {
  supabase: any;
  orderId: string;
  source?: string;
}) {
  const { supabase, orderId, source = 'unknown' } = params;

  console.info('[stock] applyOrderStockOnce:start', { orderId, source });

  const { data, error } = await supabase.rpc('apply_order_stock_once', {
    p_order_id: orderId,
  });

  if (error) {
    console.error('[stock] applyOrderStockOnce:error', {
      orderId,
      source,
      reason: error.message,
    });
    return { ok: false, no_op: false, reason: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    console.error('[stock] applyOrderStockOnce:empty_response', { orderId, source });
    return { ok: false, no_op: false, reason: 'empty_rpc_response' };
  }

  const result = {
    ok: Boolean(row.ok),
    no_op: Boolean(row.no_op),
    reason: String(row.reason || ''),
  };

  console.info('[stock] applyOrderStockOnce:done', {
    orderId,
    source,
    ...result,
  });

  return result;
}

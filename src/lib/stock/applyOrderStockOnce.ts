export async function applyOrderStockOnce(params: {
  supabase: any;
  orderId: string;
}) {
  const { supabase, orderId } = params;

  const { data, error } = await supabase.rpc('apply_order_stock_once', {
    p_order_id: orderId,
  });

  if (error) {
    return { ok: false, no_op: false, reason: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, no_op: false, reason: 'empty_rpc_response' };
  }

  return {
    ok: Boolean(row.ok),
    no_op: Boolean(row.no_op),
    reason: String(row.reason || ''),
  };
}

export async function applyStockOnceForOrder(params: {
  supabase: any;
  orderId: string;
}) {
  const { supabase, orderId } = params;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, stock_applied_at')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return {
      ok: false,
      error: orderErr?.message || 'order_not_found',
      no_op: false,
      stock_applied: false,
    };
  }

  if (order.stock_applied_at) {
    return {
      ok: true,
      no_op: true,
      stock_applied: false,
      reason: 'stock_already_applied',
    };
  }

  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsErr) {
    return {
      ok: false,
      error: itemsErr.message,
      no_op: false,
      stock_applied: false,
    };
  }

  for (const it of items || []) {
    const { data: p, error: pErr } = await supabase
      .from('products')
      .select('stock_count')
      .eq('id', it.product_id)
      .single();

    if (pErr || !p) {
      return {
        ok: false,
        error: pErr?.message || `product_not_found:${it.product_id}`,
        no_op: false,
        stock_applied: false,
      };
    }

    const next = Math.max(0, Number(p.stock_count || 0) - Number(it.quantity || 0));
    const { error: upProdErr } = await supabase
      .from('products')
      .update({ stock_count: next })
      .eq('id', it.product_id);

    if (upProdErr) {
      return {
        ok: false,
        error: upProdErr.message,
        no_op: false,
        stock_applied: false,
      };
    }
  }

  const { error: markErr } = await supabase
    .from('orders')
    .update({ stock_applied_at: new Date().toISOString() })
    .eq('id', orderId);

  if (markErr) {
    return {
      ok: false,
      error: markErr.message,
      no_op: false,
      stock_applied: false,
    };
  }

  return {
    ok: true,
    no_op: false,
    stock_applied: true,
  };
}

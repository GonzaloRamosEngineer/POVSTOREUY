// Wrapper sobre la RPC apply_order_stock_once.
//
// La RPC fue endurecida (migration 20260523_apply_order_stock_strict.sql):
// ahora hace SELECT FOR UPDATE sobre los products afectados, valida stock
// suficiente, y RAISE EXCEPTION 'insufficient_stock' si no alcanza. Antes
// usaba GREATEST(0, ...) y silenciosamente permitía oversold.
//
// Este wrapper normaliza el resultado a una shape estable para los callers:
//   { ok, no_op, reason, shortfall? }
//
// reason taxonómico:
//   - 'stock_applied'           → ok, decremento aplicado.
//   - 'stock_already_applied'   → ok, no_op (idempotente).
//   - 'order_not_found'         → !ok, orden inexistente.
//   - 'insufficient_stock'      → !ok, hay shortfall (detalle en `shortfall`).
//   - 'empty_rpc_response'      → !ok, malformado (no debería pasar en prod).
//   - cualquier otra string     → !ok, error de DB transitorio o inesperado.

export type StockApplyShortfall = {
  productId: string;
  name: string;
  available: number;
  needed: number;
};

export type StockApplyResult = {
  ok: boolean;
  no_op: boolean;
  reason: string;
  shortfall?: StockApplyShortfall;
};

// La RPC emite RAISE EXCEPTION con MESSAGE='insufficient_stock' y DETAIL
// formateado: 'product_id=X name=Y available=N needed=M'. Lo parseamos
// para exponerlo estructurado a los callers (sin obligar a parsear ellos).
function parseInsufficientStockDetail(detail: string | null | undefined): StockApplyShortfall | undefined {
  if (!detail) return undefined;
  const pid = detail.match(/product_id=([^\s]+)/)?.[1];
  const nameMatch = detail.match(/name=(.+?)\s+available=/);
  const available = detail.match(/available=(-?\d+)/)?.[1];
  const needed = detail.match(/needed=(-?\d+)/)?.[1];

  if (!pid || !available || !needed) return undefined;

  return {
    productId: pid,
    name: nameMatch?.[1]?.trim() || '',
    available: Number(available),
    needed: Number(needed),
  };
}

export async function applyOrderStockOnce(params: {
  supabase: any;
  orderId: string;
}): Promise<StockApplyResult> {
  const { supabase, orderId } = params;

  const { data, error } = await supabase.rpc('apply_order_stock_once', {
    p_order_id: orderId,
  });

  if (error) {
    // Detectar el RAISE EXCEPTION de la RPC. Postgres pasa el MESSAGE como
    // error.message; supabase-js puede incluir details/hint según versión.
    const msg = String(error.message || '');
    if (msg.includes('insufficient_stock')) {
      return {
        ok: false,
        no_op: false,
        reason: 'insufficient_stock',
        shortfall: parseInsufficientStockDetail(error.details ?? error.detail ?? msg),
      };
    }
    return { ok: false, no_op: false, reason: msg || 'unknown_db_error' };
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

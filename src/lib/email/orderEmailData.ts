// src/lib/email/orderEmailData.ts
//
// Traduce las filas de `order_items` a la vista que ve el cliente.
//
// Regla de negocio: las líneas `pack_component` son composición INTERNA del
// pack (unit_price 0) — no se listan como ítems con precio, se cuelgan del
// `pack_primary` de su mismo `pack_group_id` como "Incluye". Ver el CHECK
// de line_type en migrations/20260313_stage2a_order_items_pack_lines.sql.

import { groupOrderLines } from '@/lib/orders/groupOrderLines';

export type OrderEmailItemRow = {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_type?: 'simple' | 'pack_primary' | 'pack_component' | null;
  pack_group_id?: string | null;
};

export type OrderEmailLine = {
  name: string;
  quantity: number;
  totalPrice: number;
  /** Componentes del pack, sin precio. Vacío para líneas simples. */
  includes: string[];
};

/** Agrupa las filas crudas en las líneas visibles del mail. */
export function buildOrderEmailLines(rows: OrderEmailItemRow[]): OrderEmailLine[] {
  return groupOrderLines(rows).map(({ row, components }) => ({
    name: row.product_name,
    quantity: row.quantity,
    totalPrice: row.total_price,
    includes: components.map((c) =>
      c.quantity > 1 ? `${c.product_name} (x${c.quantity})` : c.product_name
    ),
  }));
}

export { formatUYU } from '@/lib/format/currency';

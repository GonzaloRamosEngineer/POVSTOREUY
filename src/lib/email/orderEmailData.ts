// src/lib/email/orderEmailData.ts
//
// Traduce las filas de `order_items` a la vista que ve el cliente.
//
// Regla de negocio: las líneas `pack_component` son composición INTERNA del
// pack (unit_price 0) — no se listan como ítems con precio, se cuelgan del
// `pack_primary` de su mismo `pack_group_id` como "Incluye". Ver el CHECK
// de line_type en migrations/20260313_stage2a_order_items_pack_lines.sql.

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
  const lines: OrderEmailLine[] = [];
  const byGroup = new Map<string, OrderEmailLine>();
  const orphanComponents: OrderEmailItemRow[] = [];

  for (const row of rows) {
    if (row.line_type === 'pack_component') continue;

    const line: OrderEmailLine = {
      name: row.product_name,
      quantity: row.quantity,
      totalPrice: row.total_price,
      includes: [],
    };
    lines.push(line);

    if (row.line_type === 'pack_primary' && row.pack_group_id) {
      byGroup.set(row.pack_group_id, line);
    }
  }

  for (const row of rows) {
    if (row.line_type !== 'pack_component') continue;

    const parent = row.pack_group_id ? byGroup.get(row.pack_group_id) : undefined;
    if (parent) {
      parent.includes.push(
        row.quantity > 1 ? `${row.product_name} (x${row.quantity})` : row.product_name
      );
    } else {
      // Componente sin primary: dato inconsistente. Lo mostramos igual como
      // línea propia antes que hacerlo desaparecer del mail del cliente.
      orphanComponents.push(row);
    }
  }

  for (const row of orphanComponents) {
    lines.push({
      name: row.product_name,
      quantity: row.quantity,
      totalPrice: row.total_price,
      includes: [],
    });
  }

  return lines;
}

/** Formato de moneda del sitio: $U con separador de miles es-UY. */
export function formatUYU(amount: number): string {
  return `$U ${Math.round(amount).toLocaleString('es-UY')}`;
}

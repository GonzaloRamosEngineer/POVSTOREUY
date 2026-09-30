// src/lib/orders/groupOrderLines.ts
//
// Agrupa las filas de `order_items` en las líneas que ve el cliente.
// Fuente única de la regla: la usan la página de seguimiento y los mails.
//
// Regla de negocio: las filas `pack_component` son composición INTERNA del
// pack (unit_price 0). No se muestran como ítems con precio: se cuelgan del
// `pack_primary` de su mismo `pack_group_id`. Ver el CHECK de line_type en
// migrations/20260313_stage2a_order_items_pack_lines.sql.

export type GroupableOrderRow = {
  product_name: string;
  quantity: number;
  total_price: number;
  line_type?: 'simple' | 'pack_primary' | 'pack_component' | null;
  pack_group_id?: string | null;
};

export type GroupedOrderLine<T extends GroupableOrderRow> = {
  /** La fila que se muestra con precio (simple o pack_primary). */
  row: T;
  /** Componentes del pack, en orden. Vacío para líneas simples. */
  components: T[];
};

export function groupOrderLines<T extends GroupableOrderRow>(rows: T[]): GroupedOrderLine<T>[] {
  const lines: GroupedOrderLine<T>[] = [];
  const byGroup = new Map<string, GroupedOrderLine<T>>();
  const orphans: T[] = [];

  for (const row of rows) {
    if (row.line_type === 'pack_component') continue;
    const line: GroupedOrderLine<T> = { row, components: [] };
    lines.push(line);
    if (row.line_type === 'pack_primary' && row.pack_group_id) {
      byGroup.set(row.pack_group_id, line);
    }
  }

  for (const row of rows) {
    if (row.line_type !== 'pack_component') continue;
    const parent = row.pack_group_id ? byGroup.get(row.pack_group_id) : undefined;
    if (parent) parent.components.push(row);
    else orphans.push(row);
  }

  // Componente sin primary: dato inconsistente. Se muestra como línea propia
  // antes que hacerlo desaparecer de lo que ve el cliente.
  for (const row of orphans) lines.push({ row, components: [] });

  return lines;
}

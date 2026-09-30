import { describe, it, expect } from 'vitest';
import { buildOrderEmailLines, formatUYU, type OrderEmailItemRow } from './orderEmailData';
import { shouldNotifyCustomer } from './sendOrderStatusEmail';
import { isOrderNotifiable } from '@/config/admin';

const PACK_GROUP = 'e31ca4aa-0000-0000-0000-00000000a9f1';

// Caso real: pedido POV-919687 (Kit POV Base = primary + 3 componentes en $0)
const packRows: OrderEmailItemRow[] = [
  {
    product_name: 'SJCAM C100+ - Kit POV Base',
    quantity: 1,
    unit_price: 7690,
    total_price: 7690,
    line_type: 'pack_primary',
    pack_group_id: PACK_GROUP,
  },
  { product_name: 'SJCAM C100+', quantity: 1, unit_price: 0, total_price: 0, line_type: 'pack_component', pack_group_id: PACK_GROUP },
  { product_name: 'MicroSD LEXAR 64GB SILVER PLUS', quantity: 1, unit_price: 0, total_price: 0, line_type: 'pack_component', pack_group_id: PACK_GROUP },
  { product_name: 'Arnés de montaje de pecho Ajustable', quantity: 1, unit_price: 0, total_price: 0, line_type: 'pack_component', pack_group_id: PACK_GROUP },
];

describe('buildOrderEmailLines', () => {
  it('colapsa los componentes del pack bajo su primary y no los cobra dos veces', () => {
    const lines = buildOrderEmailLines(packRows);

    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe('SJCAM C100+ - Kit POV Base');
    expect(lines[0].totalPrice).toBe(7690);
    expect(lines[0].includes).toEqual([
      'SJCAM C100+',
      'MicroSD LEXAR 64GB SILVER PLUS',
      'Arnés de montaje de pecho Ajustable',
    ]);
  });

  it('nunca expone una línea en $0 al cliente', () => {
    const lines = buildOrderEmailLines(packRows);
    expect(lines.every((l) => l.totalPrice > 0)).toBe(true);
  });

  it('deja las líneas simples intactas y conserva el orden', () => {
    const lines = buildOrderEmailLines([
      { product_name: 'Trípode', quantity: 2, unit_price: 500, total_price: 1000, line_type: 'simple', pack_group_id: null },
      ...packRows,
    ]);

    expect(lines.map((l) => l.name)).toEqual(['Trípode', 'SJCAM C100+ - Kit POV Base']);
    expect(lines[0].quantity).toBe(2);
    expect(lines[0].includes).toEqual([]);
  });

  it('marca la cantidad en los componentes cuando es mayor a 1', () => {
    const lines = buildOrderEmailLines([
      packRows[0],
      { ...packRows[2], quantity: 2 },
    ]);
    expect(lines[0].includes).toEqual(['MicroSD LEXAR 64GB SILVER PLUS (x2)']);
  });

  it('no desaparece un componente huérfano (sin primary en el grupo)', () => {
    const lines = buildOrderEmailLines([
      { product_name: 'Componente suelto', quantity: 1, unit_price: 0, total_price: 0, line_type: 'pack_component', pack_group_id: 'grupo-inexistente' },
    ]);
    expect(lines.map((l) => l.name)).toEqual(['Componente suelto']);
  });

  it('tolera una orden sin items', () => {
    expect(buildOrderEmailLines([])).toEqual([]);
  });
});

describe('formatUYU', () => {
  it('usa el formato del sitio', () => {
    expect(formatUYU(7690)).toBe('UYU 7.690');
  });
});

describe('shouldNotifyCustomer', () => {
  it('avisa en los estados visibles para el cliente', () => {
    expect(shouldNotifyCustomer('pending', 'processing')).toBe(true);
    expect(shouldNotifyCustomer('processing', 'ready')).toBe(true);
    expect(shouldNotifyCustomer('ready', 'shipped')).toBe(true);
  });

  it('no avisa en estados internos ni en cancelaciones', () => {
    expect(shouldNotifyCustomer('processing', 'completed')).toBe(false);
    expect(shouldNotifyCustomer('processing', 'cancelled')).toBe(false);
    expect(shouldNotifyCustomer(null, 'pending')).toBe(false);
  });

  it('no reenvía si el estado no cambió (doble guardado del admin)', () => {
    expect(shouldNotifyCustomer('processing', 'processing')).toBe(false);
  });
});

describe('isOrderNotifiable (corte de mails)', () => {
  it('no notifica órdenes anteriores al corte', () => {
    expect(isOrderNotifiable('2026-09-29T10:00:00-03:00')).toBe(false);
    expect(isOrderNotifiable('2026-06-14T20:02:00-03:00')).toBe(false);
  });

  it('notifica órdenes posteriores al corte', () => {
    expect(isOrderNotifiable('2026-09-30T00:30:00-03:00')).toBe(true);
    expect(isOrderNotifiable('2026-12-01T12:00:00-03:00')).toBe(true);
  });

  it('ante un created_at ausente o inválido, no notifica', () => {
    expect(isOrderNotifiable(null)).toBe(false);
    expect(isOrderNotifiable(undefined)).toBe(false);
    expect(isOrderNotifiable('no-es-una-fecha')).toBe(false);
  });
});

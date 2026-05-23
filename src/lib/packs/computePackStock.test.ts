import { describe, expect, it } from 'vitest';
import {
  buildProductsLookup,
  computePackEffectiveStock,
  getPackEffectiveStock,
  type PackLike,
  type ProductStockLike,
} from './computePackStock';

const CAMERA: ProductStockLike = { id: 'cam-1', name: 'Cámara C100Plus', stock_count: 14, is_active: true };
const MEMORY: ProductStockLike = { id: 'mem-1', name: 'MicroSD 64GB', stock_count: 8, is_active: true };
const HARNESS: ProductStockLike = { id: 'har-1', name: 'Arnés Pecho', stock_count: 5, is_active: true };
const PET_HARNESS: ProductStockLike = { id: 'pet-1', name: 'Arnés Mascota', stock_count: 0, is_active: true };
const INACTIVE: ProductStockLike = { id: 'inact-1', name: 'Discontinuado', stock_count: 99, is_active: false };

function lookup(...prods: ProductStockLike[]) {
  return buildProductsLookup(prods);
}

describe('computePackEffectiveStock', () => {
  it('devuelve 0 + ok=false para pack sin componentes', () => {
    const pack: PackLike = { id: 'p1', components: [] };
    const r = computePackEffectiveStock(pack, lookup(CAMERA));
    expect(r.stock).toBe(0);
    expect(r.ok).toBe(false);
    expect(r.breakdown).toHaveLength(0);
  });

  it('pack con un solo componente: stock = available / quantity', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [{ product_id: 'mem-1', quantity: 1, role: 'primary' }],
    };
    const r = computePackEffectiveStock(pack, lookup(MEMORY));
    expect(r.stock).toBe(8);
    expect(r.ok).toBe(true);
    expect(r.limiting?.product_id).toBe('mem-1');
  });

  it('caso real Kit Esencial (1 cámara + 1 memoria): limitante es memoria con stock=8', () => {
    const pack: PackLike = {
      id: 'kit-esencial',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'mem-1', quantity: 1, role: 'component' },
      ],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA, MEMORY));
    expect(r.stock).toBe(8);
    expect(r.limiting?.product_id).toBe('mem-1');
    expect(r.breakdown).toHaveLength(2);
  });

  it('caso real Kit Full Mascotas: arnés mascota en 0 → stock=0 aunque cámara y memoria tengan', () => {
    const pack: PackLike = {
      id: 'kit-mascotas',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'mem-1', quantity: 1, role: 'component' },
        { product_id: 'pet-1', quantity: 1, role: 'component' },
      ],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA, MEMORY, PET_HARNESS));
    expect(r.stock).toBe(0);
    expect(r.limiting?.product_id).toBe('pet-1');
    expect(r.ok).toBe(true);
  });

  it('quantity > 1: stock se divide y se redondea hacia abajo', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'mem-1', quantity: 3, role: 'component' }, // 3 memorias por kit
      ],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA, MEMORY)); // mem=8 / 3 = 2.66 → 2
    expect(r.stock).toBe(2);
    expect(r.limiting?.product_id).toBe('mem-1');
    expect(r.limiting?.kits_supported).toBe(2);
  });

  it('componente referenciado pero no existe en el lookup → stock=0 + ok=false', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'ghost-id', quantity: 1, role: 'component' },
      ],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA));
    expect(r.stock).toBe(0);
    expect(r.ok).toBe(false);
    expect(r.limiting?.product_id).toBe('ghost-id');
  });

  it('componente inactivo → stock=0 + ok=false', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'inact-1', quantity: 1, role: 'component' },
      ],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA, INACTIVE));
    expect(r.stock).toBe(0);
    expect(r.ok).toBe(false);
  });

  it('stock_count negativo en DB → se clampa a 0', () => {
    const broken: ProductStockLike = { id: 'b-1', name: 'Roto', stock_count: -5, is_active: true };
    const pack: PackLike = {
      id: 'p1',
      components: [{ product_id: 'b-1', quantity: 1, role: 'primary' }],
    };
    const r = computePackEffectiveStock(pack, lookup(broken));
    expect(r.stock).toBe(0);
  });

  it('stock_count null o undefined → 0', () => {
    const nullStock: ProductStockLike = { id: 'n-1', name: 'Null', stock_count: null, is_active: true };
    const pack: PackLike = {
      id: 'p1',
      components: [{ product_id: 'n-1', quantity: 1, role: 'primary' }],
    };
    const r = computePackEffectiveStock(pack, lookup(nullStock));
    expect(r.stock).toBe(0);
  });

  it('componente con quantity inválido (0 o negativo) → pack no armable', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [{ product_id: 'cam-1', quantity: 0, role: 'primary' }],
    };
    const r = computePackEffectiveStock(pack, lookup(CAMERA));
    expect(r.stock).toBe(0);
    expect(r.ok).toBe(false);
  });

  it('getPackEffectiveStock atajo devuelve solo el número', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [
        { product_id: 'cam-1', quantity: 1, role: 'primary' },
        { product_id: 'mem-1', quantity: 1, role: 'component' },
      ],
    };
    expect(getPackEffectiveStock(pack, lookup(CAMERA, MEMORY))).toBe(8);
  });

  it('lookup acepta tanto Map como Record', () => {
    const pack: PackLike = {
      id: 'p1',
      components: [{ product_id: 'cam-1', quantity: 1, role: 'primary' }],
    };
    const asMap = lookup(CAMERA);
    const asRecord: Record<string, ProductStockLike> = { 'cam-1': CAMERA };
    expect(getPackEffectiveStock(pack, asMap)).toBe(14);
    expect(getPackEffectiveStock(pack, asRecord)).toBe(14);
  });
});

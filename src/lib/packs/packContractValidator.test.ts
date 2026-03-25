import { describe, expect, it } from 'vitest';
import { validatePackContract } from './packContractValidator';

const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('validatePackContract', () => {
  it('rejects invalid pack shape', () => {
    const result = validatePackContract(null);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_INVALID_SHAPE')).toBe(true);
  });

  it('rejects pack without id', () => {
    const result = validatePackContract({
      components: [{ product_id: VALID_UUID_1, quantity: 1, role: 'primary' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_MISSING_ID')).toBe(true);
  });

  it('rejects empty components', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_COMPONENTS_REQUIRED')).toBe(true);
    expect(result.errors.some((e) => e.code === 'PACK_PRIMARY_COUNT_INVALID')).toBe(true);
  });

  it('rejects invalid component product_id', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [{ product_id: 'not-a-uuid', quantity: 1, role: 'primary' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_COMPONENT_INVALID_PRODUCT_ID')).toBe(true);
  });

  it('rejects invalid component quantity', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [{ product_id: VALID_UUID_1, quantity: 0, role: 'primary' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_COMPONENT_INVALID_QUANTITY')).toBe(true);
  });

  it('rejects invalid component role', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [{ product_id: VALID_UUID_1, quantity: 1, role: 'invalid-role' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_COMPONENT_INVALID_ROLE')).toBe(true);
  });

  it('rejects invalid primary count when there is no primary', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [{ product_id: VALID_UUID_1, quantity: 1, role: 'component' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_PRIMARY_COUNT_INVALID')).toBe(true);
  });

  it('rejects invalid primary count when there is more than one primary', () => {
    const result = validatePackContract({
      id: 'pack-a',
      components: [
        { product_id: VALID_UUID_1, quantity: 1, role: 'primary' },
        { product_id: VALID_UUID_2, quantity: 1, role: 'primary' },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_PRIMARY_COUNT_INVALID')).toBe(true);
  });

  it('rejects invalid version', () => {
    const result = validatePackContract({
      id: 'pack-a',
      version: 0,
      components: [{ product_id: VALID_UUID_1, quantity: 1, role: 'primary' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation to fail');
    expect(result.errors.some((e) => e.code === 'PACK_VERSION_INVALID')).toBe(true);
  });

  it('accepts valid pack and returns normalized payload', () => {
    const result = validatePackContract({
      id: 'pack-ok',
      version: '2',
      components: [
        { product_id: VALID_UUID_1, quantity: 1, role: 'primary' },
        { product_id: VALID_UUID_2, quantity: 3, role: 'component' },
      ],
      extraField: 'kept-in-raw',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected validation to pass');

    expect(result.normalized.id).toBe('pack-ok');
    expect(result.normalized.version).toBe(2);
    expect(result.normalized.components).toEqual([
      { product_id: VALID_UUID_1, quantity: 1, role: 'primary' },
      { product_id: VALID_UUID_2, quantity: 3, role: 'component' },
    ]);
    expect(result.normalized.raw.extraField).toBe('kept-in-raw');
  });
});
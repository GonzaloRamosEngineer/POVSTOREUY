const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PackValidationErrorCode =
  | 'PACK_INVALID_SHAPE'
  | 'PACK_MISSING_ID'
  | 'PACK_COMPONENTS_REQUIRED'
  | 'PACK_COMPONENT_INVALID_SHAPE'
  | 'PACK_COMPONENT_INVALID_PRODUCT_ID'
  | 'PACK_COMPONENT_INVALID_QUANTITY'
  | 'PACK_COMPONENT_INVALID_ROLE'
  | 'PACK_PRIMARY_COUNT_INVALID'
  | 'PACK_VERSION_INVALID';

export type PackValidationError = {
  code: PackValidationErrorCode;
  message: string;
  packIndex?: number;
  packId?: string;
  componentIndex?: number;
};

export type NormalizedPackComponent = {
  product_id: string;
  quantity: number;
  role: 'primary' | 'component';
};

export type NormalizedPack = {
  id: string;
  version: number | null;
  components: NormalizedPackComponent[];
  raw: Record<string, any>;
};

export type PackValidationResult =
  | { ok: true; normalized: NormalizedPack }
  | { ok: false; errors: PackValidationError[] };

export type PackValidationSummary = {
  ok: boolean;
  normalized: NormalizedPack[];
  errors: PackValidationError[];
};

function buildError(
  code: PackValidationErrorCode,
  message: string,
  ctx: { packIndex?: number; packId?: string; componentIndex?: number } = {},
): PackValidationError {
  return {
    code,
    message,
    ...ctx,
  };
}

export function validatePackContract(
  pack: unknown,
  ctx: { index?: number; packId?: string } = {},
): PackValidationResult {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    return {
      ok: false,
      errors: [buildError('PACK_INVALID_SHAPE', 'Pack must be an object', { packIndex: ctx.index, packId: ctx.packId })],
    };
  }

  const rawPack = pack as Record<string, any>;
  const packId = String(ctx.packId || rawPack.id || '').trim();
  const errors: PackValidationError[] = [];

  if (!packId) {
    errors.push(buildError('PACK_MISSING_ID', 'Pack id is required', { packIndex: ctx.index }));
  }

  const componentsRaw = rawPack.components;
  if (!Array.isArray(componentsRaw) || componentsRaw.length === 0) {
    errors.push(buildError('PACK_COMPONENTS_REQUIRED', 'Pack components must be a non-empty array', { packIndex: ctx.index, packId }));
  }

  const normalizedComponents: NormalizedPackComponent[] = [];
  let primaryCount = 0;

  if (Array.isArray(componentsRaw)) {
    componentsRaw.forEach((comp: any, componentIndex: number) => {
      if (!comp || typeof comp !== 'object' || Array.isArray(comp)) {
        errors.push(
          buildError('PACK_COMPONENT_INVALID_SHAPE', 'Pack component must be an object', {
            packIndex: ctx.index,
            packId,
            componentIndex,
          }),
        );
        return;
      }

      const productId = String(comp.product_id || '').trim();
      const quantityNumber = Number(comp.quantity ?? 0);
      const role = comp.role === 'primary' ? 'primary' : comp.role === 'component' ? 'component' : null;

      if (!productId || !UUID_RE.test(productId)) {
        errors.push(
          buildError('PACK_COMPONENT_INVALID_PRODUCT_ID', 'Component product_id must be a valid UUID', {
            packIndex: ctx.index,
            packId,
            componentIndex,
          }),
        );
      }

      if (!Number.isFinite(quantityNumber) || quantityNumber <= 0 || !Number.isInteger(quantityNumber)) {
        errors.push(
          buildError('PACK_COMPONENT_INVALID_QUANTITY', 'Component quantity must be an integer greater than 0', {
            packIndex: ctx.index,
            packId,
            componentIndex,
          }),
        );
      }

      if (!role) {
        errors.push(
          buildError('PACK_COMPONENT_INVALID_ROLE', 'Component role must be either primary or component', {
            packIndex: ctx.index,
            packId,
            componentIndex,
          }),
        );
      }

      if (role === 'primary') primaryCount += 1;

      if (productId && UUID_RE.test(productId) && role && Number.isFinite(quantityNumber) && quantityNumber > 0 && Number.isInteger(quantityNumber)) {
        normalizedComponents.push({
          product_id: productId,
          quantity: quantityNumber,
          role,
        });
      }
    });
  }

  if (Array.isArray(componentsRaw) && primaryCount !== 1) {
    errors.push(
      buildError('PACK_PRIMARY_COUNT_INVALID', 'Pack must contain exactly one primary component', {
        packIndex: ctx.index,
        packId,
      }),
    );
  }

  let normalizedVersion: number | null = null;
  if (rawPack.version !== undefined && rawPack.version !== null && rawPack.version !== '') {
    const versionNum = Number(rawPack.version);
    if (!Number.isFinite(versionNum) || versionNum < 1 || !Number.isInteger(versionNum)) {
      errors.push(buildError('PACK_VERSION_INVALID', 'Pack version must be an integer greater than or equal to 1', {
        packIndex: ctx.index,
        packId,
      }));
    } else {
      normalizedVersion = versionNum;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    normalized: {
      id: packId,
      version: normalizedVersion,
      components: normalizedComponents,
      raw: rawPack,
    },
  };
}

export function validatePackContracts(packs: unknown[]): PackValidationSummary {
  const normalized: NormalizedPack[] = [];
  const errors: PackValidationError[] = [];

  packs.forEach((pack, index) => {
    const result = validatePackContract(pack, { index });
    if (result.ok === true) {
      normalized.push(result.normalized);
    } else {
      errors.push(...result.errors);
    }
  });

  return {
    ok: errors.length === 0,
    normalized,
    errors,
  };
}

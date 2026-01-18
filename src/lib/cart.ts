// C:\Projects\POVStoreUruguay\src\lib\cart.ts

export type CartItem = {
  id: string;        // UUID real de products.id
  name: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
  stock?: number;    // si está, limita cantidad
  model?: string;
};

const CART_KEY = 'povstore_cart'; // <-- importante: unificado

function safeParse(raw: string | null): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse(window.localStorage.getItem(CART_KEY));
  return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
}

export function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_KEY);
}

/**
 * Inserta o actualiza un item por id.
 * Si el item ya existe, mergea campos y mantiene clamp por stock si corresponde.
 */
export function upsertCartItem(next: CartItem) {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === next.id);

  if (idx >= 0) {
    const merged = { ...items[idx], ...next };

    // clamp por stock si existe
    if (merged.stock != null) {
      merged.quantity = Math.min(merged.quantity ?? 0, merged.stock);
    }

    items[idx] = merged;
  } else {
    const item = { ...next };

    // clamp por stock si existe
    if (item.stock != null) {
      item.quantity = Math.min(item.quantity ?? 0, item.stock);
    }

    items.push(item);
  }

  writeCart(items);
}

/**
 * Suma cantidad de un item existente. Si hay stock, limita la cantidad máxima.
 */
export function incrementItem(id: string, by = 1) {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === id);

  if (idx >= 0) {
    const current = items[idx];
    const max = current.stock ?? Infinity;

    items[idx] = {
      ...current,
      quantity: Math.min((current.quantity ?? 0) + by, max),
    };
  }

  writeCart(items);
}

/**
 * Actualiza la cantidad exacta. Si hay stock, limita el máximo. Si quantity <= 0, elimina.
 */
export function updateQty(id: string, quantity: number) {
  const items = readCart()
    .map((i) => {
      if (i.id !== id) return i;

      const max = i.stock ?? Infinity;
      const q = Math.max(0, Math.min(quantity, max));

      return { ...i, quantity: q };
    })
    .filter((i) => (i.quantity ?? 0) > 0);

  writeCart(items);
}

export function removeItem(id: string) {
  writeCart(readCart().filter((i) => i.id !== id));
}

/**
 * Helper recomendado: agrega al carrito o incrementa si ya existe.
 * - qty por defecto = 1
 * - Si existe stock, hace clamp.
 * - Si el item existe, mergea campos nuevos (por ej: image/alt/model/stock).
 */
export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }, qty = 1) {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === item.id);

  if (idx >= 0) {
    const current = items[idx];

    const merged: CartItem = {
      ...current,
      ...item,
      quantity: (current.quantity ?? 0) + (qty ?? 1),
    };

    const max = merged.stock ?? Infinity;
    merged.quantity = Math.min(merged.quantity, max);

    items[idx] = merged;
  } else {
    const initialQty = item.quantity ?? qty ?? 1;

    const next: CartItem = {
      ...(item as any),
      quantity: initialQty,
    };

    const max = next.stock ?? Infinity;
    next.quantity = Math.min(next.quantity, max);

    items.push(next);
  }

  writeCart(items);
}

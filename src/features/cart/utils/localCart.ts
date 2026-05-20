import type { LocalCartItem } from '../types';

const CART_KEY = 'sansistore_cart';
const MAX_UNITS = 100;

export function getLocalCart(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCart(items: LocalCartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getTotalUnits(items: LocalCartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function addToLocalCart(
  productId: string,
  stock: number
): { success: boolean; error?: string; items: LocalCartItem[] } {
  const items = getLocalCart();
  const totalUnits = getTotalUnits(items);
  if (totalUnits >= MAX_UNITS) {
    return { success: false, error: 'Límite máximo de 100 unidades alcanzado.', items };
  }
  const existing = items.find((i) => i.productId === productId);
  const currentQty = existing ? existing.quantity : 0;
  if (currentQty >= stock) {
    return { success: false, error: 'No hay stock suficiente disponible.', items };
  }
  let updated: LocalCartItem[];
  if (existing) {
    updated = items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: i.quantity + 1, updatedAt: Date.now() }
        : i
    );
  } else {
    updated = [...items, { productId, quantity: 1, updatedAt: Date.now() }];
  }
  saveLocalCart(updated);
  return { success: true, items: updated };
}

export function updateLocalCartQuantity(
  productId: string,
  delta: number,
  stock: number
): { success: boolean; error?: string; items: LocalCartItem[] } {
  const items = getLocalCart();
  const item = items.find((i) => i.productId === productId);
  if (!item) return { success: false, error: 'Producto no encontrado en carrito.', items };
  const newQty = item.quantity + delta;
  if (newQty<1) {
        return {success:false, items}
    };
  if (delta>0) {
    if (newQty>stock) {
      return { success: false, error: 'Sin stock suficiente.', items };
    }
    const totalUnits = getTotalUnits(items);
    if (totalUnits + delta > MAX_UNITS) {
      return { success: false, error: 'Límite máximo de 100 unidades alcanzado.', items };
    }
  }

  const updated = items.map((i) => i.productId === productId ? { ...i, quantity: newQty, updatedAt: Date.now()} : i);
  saveLocalCart(updated);
  return {success:true, items:updated};
}

export function removeFromLocalCart(productId: string): LocalCartItem[] {
  const items = getLocalCart().filter((i) => i.productId !== productId);
  saveLocalCart(items);
  return items;
}

export function clearLocalCart(): void {
  localStorage.removeItem(CART_KEY);
}
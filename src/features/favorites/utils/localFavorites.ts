import type { FavoriteItem } from '../types';

const FAVORITES_KEY = 'sansistore_favorites';

function normalizeFavorites(value: unknown): FavoriteItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const favorites: FavoriteItem[] = [];

  value.forEach((item) => {
    const productId =
      typeof item === 'string'
        ? item
        : typeof item?.productId === 'string'
          ? item.productId
          : '';

    if (!productId || seen.has(productId)) return;

    seen.add(productId);
    favorites.push({
      productId,
      createdAt:
        typeof item === 'object' && typeof item?.createdAt === 'number'
          ? item.createdAt
          : Date.now(),
    });
  });

  return favorites;
}

export function getLocalFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? normalizeFavorites(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveLocalFavorites(items: FavoriteItem[]): void {
  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(normalizeFavorites(items))
  );
}

export function addLocalFavorite(productId: string): FavoriteItem[] {
  const current = getLocalFavorites();
  if (current.some((item) => item.productId === productId)) return current;

  const updated = [...current, { productId, createdAt: Date.now() }];
  saveLocalFavorites(updated);
  return updated;
}

export function removeLocalFavorite(productId: string): FavoriteItem[] {
  const updated = getLocalFavorites().filter(
    (item) => item.productId !== productId
  );
  saveLocalFavorites(updated);
  return updated;
}

export function clearLocalFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY);
}

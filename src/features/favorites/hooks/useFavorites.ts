import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import {
  addLocalFavorite,
  getLocalFavorites,
  removeLocalFavorite,
  saveLocalFavorites,
} from '../utils/localFavorites';
import {
  deleteFavoriteItem,
  getFavoriteItems,
  syncFavoritesToFirestore,
  upsertFavoriteItem,
} from '../services/favoritesFirestore';
import type { FavoriteItem } from '../types';

function mergeFavorites(
  localItems: FavoriteItem[],
  remoteItems: FavoriteItem[]
): FavoriteItem[] {
  const favoritesByProduct = new Map<string, FavoriteItem>();

  [...remoteItems, ...localItems].forEach((item) => {
    if (!item.productId || favoritesByProduct.has(item.productId)) return;
    favoritesByProduct.set(item.productId, {
      productId: item.productId,
      createdAt: item.createdAt ?? Date.now(),
    });
  });

  return [...favoritesByProduct.values()];
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      uidRef.current = user?.uid ?? null;
      setLoading(true);
      setError(null);

      const localItems = getLocalFavorites();

      if (!user) {
        setItems(localItems);
        setLoading(false);
        return;
      }

      try {
        const remoteItems = await getFavoriteItems(user.uid);
        const merged = mergeFavorites(localItems, remoteItems);
        await syncFavoritesToFirestore(user.uid, merged);
        saveLocalFavorites(merged);
        setItems(merged);
      } catch {
        setError('No se pudieron sincronizar tus favoritos.');
        setItems(localItems);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const favoriteIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items]
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      setError(null);
      const previousItems = items;
      const currentlyFavorite = favoriteIds.has(productId);
      const updated = currentlyFavorite
        ? removeLocalFavorite(productId)
        : addLocalFavorite(productId);

      setItems(updated);

      if (!uidRef.current) return true;

      try {
        if (currentlyFavorite) {
          await deleteFavoriteItem(uidRef.current, productId);
        } else {
          await upsertFavoriteItem(uidRef.current, productId);
        }
        return true;
      } catch {
        saveLocalFavorites(previousItems);
        setItems(previousItems);
        setError('No se pudo actualizar el favorito. Intenta nuevamente.');
        return false;
      }
    },
    [favoriteIds, items]
  );

  return {
    items,
    favoriteIds,
    loading,
    error,
    isFavorite,
    toggleFavorite,
  };
}

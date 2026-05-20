import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { getTopProducts } from '../../services/topProductServices';
import type { TopProduct, TopProductsState, CategoryOption } from '../types';

const TOP_LIMIT = 10;
const POLLING_INTERVAL = 30000; // 30 segundos

export function useTopProducts(): TopProductsState & { refresh: () => void } {
  const [state, setState] = useState<TopProductsState>({
    products: [],
    categories: [],
    loading: true,
    error: null,
  });

  const loadCategories = useCallback(async (): Promise<CategoryOption[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const options: CategoryOption[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name ?? 'Sin categoría',
      }));
      return options.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }, []);

  const fetchProducts = useCallback(async (categories: CategoryOption[]) => {
    try {
      const { products } = await getTopProducts({ limit: TOP_LIMIT });
      setState((prev) => ({
        ...prev,
        products,
        categories,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar productos.',
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loadCategories().then(fetchProducts);
  }, [loadCategories, fetchProducts]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const init = async () => {
      const categories = await loadCategories();
      if (cancelled) return;
      await fetchProducts(categories);
      if (cancelled) return;

      // Polling cada 30 segundos
      interval = setInterval(() => {
        if (!cancelled) fetchProducts(categories);
      }, POLLING_INTERVAL);
    };

    init();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [loadCategories, fetchProducts]);

  return { ...state, refresh };
}
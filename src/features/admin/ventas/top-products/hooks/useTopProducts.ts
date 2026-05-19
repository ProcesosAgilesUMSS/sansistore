import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import type { TopProduct, TopProductsState, CategoryOption } from '../types';

const TOP_LIMIT = 10;

export function useTopProducts(): TopProductsState {
  const [state, setState] = useState<TopProductsState>({
    products: [],
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let categoriesMap = new Map<string, string>();

    const loadCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const options: CategoryOption[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          categoriesMap.set(doc.id, data.name ?? 'Sin categoría');
          options.push({ id: doc.id, name: data.name ?? 'Sin categoría' });
        });

        options.sort((a, b) => a.name.localeCompare(b.name));
        return options;
      } catch {
        return [];
      }
    };

    let unsubscribe: (() => void) | null = null;

    loadCategories().then((categories) => {
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('soldCount', 'desc'),
        limit(TOP_LIMIT),
      );

      unsubscribe = onSnapshot(
        productsQuery,
        (snapshot) => {
          const products: TopProduct[] = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name ?? '',
                categoryId: data.categoryId ?? '',
                categoryName: categoriesMap.get(data.categoryId) ?? 'Sin categoría',
                price: typeof data.price === 'number' ? data.price : 0,
                imageUrl: data.imageUrl ?? '',
                soldCount: typeof data.soldCount === 'number' ? data.soldCount : 0,
              };
            })
            .filter((product) => product.soldCount > 0);

          setState({
            products,
            categories,
            loading: false,
            error: null,
          });
        },
        (error) => {
          setState({
            products: [],
            categories,
            loading: false,
            error: error.message,
          });
        },
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return state;
}
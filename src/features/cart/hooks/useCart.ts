import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { getLocalCart, addToLocalCart, updateLocalCartQuantity, removeFromLocalCart, getTotalUnits } from '../utils/localCart';
import { syncCartToFirestore, upsertCartItem, deleteCartItem } from '../services/cartFirestore';
import { notifyCartUpdate } from '../store/cartStore';
import type { LocalCartItem, CartProduct, CartItemWithProduct } from '../types';

export function useCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [itemsWithProducts, setItemsWithProducts] = useState<CartItemWithProduct[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const productCacheRef = useRef<Map<string, CartProduct>>(new Map());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      uidRef.current = user?.uid ?? null;
      const local = getLocalCart();
      setItems(local);
      setTotalUnits(getTotalUnits(local));
      notifyCartUpdate(getTotalUnits(local));
      if (user) {
        try {
          await syncCartToFirestore(user.uid, local);
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function enrich() {
      setLoading(true);
      const enriched: CartItemWithProduct[] = await Promise.all(
        items.map(async (item) => {
          let product = productCacheRef.current.get(item.productId) ?? null;
          if (!product) {
            try {
              const [productSnap, inventorySnap] = await Promise.all([
                getDoc(doc(db, 'products', item.productId)),
                getDocs(query(
                  collection(db, 'inventory'),
                  where('productId', '==', item.productId),
                  limit(1)
                )),
              ]);
              if (productSnap.exists()) {
                const inventoryData = inventorySnap.empty ? null : inventorySnap.docs[0].data();
                product = {
                  id: productSnap.id,
                  ...productSnap.data(),
                  stockAvailable: inventoryData?.stockAvailable ?? 0,
                  stockTotal: inventoryData?.stockTotal ?? 0,
                } as CartProduct;
                productCacheRef.current.set(item.productId, product);
              }
            } catch {}
          }
          return {
            ...item,
            userId: uidRef.current ?? '',
            updatedAt: new Date(item.updatedAt),
            cartItemId: item.productId,
            product,
            included: true,
          };
        })
      );
      if (!cancelled) {
        setItemsWithProducts(enriched);
        setLoading(false);
      }
    }

    enrich();
    return () => { cancelled = true; };
  }, [items]);

  const addToCart = useCallback(async (productId: string, stock: number) => {
    setError(null);
    const result = addToLocalCart(productId, stock);
    if (!result.success) {
      setError(result.error ?? null);
      return false;
    }
    setItems(result.items);
    setTotalUnits(getTotalUnits(result.items));
    notifyCartUpdate(getTotalUnits(result.items));
    if (uidRef.current) {
      const item = result.items.find((i) => i.productId === productId);
      if (item) {
        try { await upsertCartItem(uidRef.current, productId, item.quantity); } catch {}
      }
    }
    return true;
  }, []);

  const updateQuantity = useCallback(async (productId: string, delta: number, stock: number) => {
    setError(null);
    const result = updateLocalCartQuantity(productId, delta, stock);
    if (!result.success) {
      setError(result.error ?? null);
      return false;
    }
    setItems(result.items);
    setTotalUnits(getTotalUnits(result.items));
    notifyCartUpdate(getTotalUnits(result.items));
    if (uidRef.current) {
      const item = result.items.find((i) => i.productId === productId);
      if (item) {
        try { await upsertCartItem(uidRef.current, productId, item.quantity); } catch {}
      }
    }
    return true;
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const updated = removeFromLocalCart(productId);
    setItems(updated);
    setTotalUnits(getTotalUnits(updated));
    notifyCartUpdate(getTotalUnits(updated));
    if (uidRef.current) {
      try { await deleteCartItem(uidRef.current, productId); } catch {}
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    items,
    itemsWithProducts,
    totalUnits,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearError,
  };
};
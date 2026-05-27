import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { getLocalCart, addToLocalCart, updateLocalCartQuantity, setQuantityLocalCart, removeFromLocalCart, getTotalUnits, saveLocalCart } from '../utils/localCart';
import { syncCartToFirestore, upsertCartItem, deleteCartItem } from '../services/cartFirestore';
import { notifyCartUpdate } from '../store/cartStore';
import type { LocalCartItem, CartProduct, CartItemWithProduct } from '../types';

function cartCol(uid: string) {
  return collection(db, 'users', uid, 'cartItems');
}

export function useCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [itemsWithProducts, setItemsWithProducts] = useState<CartItemWithProduct[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const productCacheRef = useRef<
    Map<string, { product: CartProduct | null; inventoryEnabled: boolean }>
  >(new Map());

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    uidRef.current = user?.uid ?? null;
    const local = getLocalCart();
    if (user) {
      try {
        if (local.length > 0) {
          await syncCartToFirestore(user.uid, local);
          setItems(local);
          setTotalUnits(getTotalUnits(local));
          notifyCartUpdate(getTotalUnits(local));
        } else {
          const snap = await getDocs(cartCol(user.uid));
          if (!snap.empty) {
            const fromFirestore: LocalCartItem[] = snap.docs.map((d) => {
              const data = d.data();
              const item: LocalCartItem = {
                productId: data.productId,
                quantity: data.quantity,
                updatedAt: Date.now(),
              };
              if (typeof data.priceAtAdd === 'number') {
                item.priceAtAdd = data.priceAtAdd;
              }
              return item;
            });
            saveLocalCart(fromFirestore);
            setItems(fromFirestore);
            setTotalUnits(getTotalUnits(fromFirestore));
            notifyCartUpdate(getTotalUnits(fromFirestore));
          }
        }
      } catch {}
    } else {
      setItems(local);
      setTotalUnits(getTotalUnits(local));
      notifyCartUpdate(getTotalUnits(local));
    }
  });
  return () => unsub();
}, []);

  useEffect(() => {
    let cancelled = false;

    function buildEnriched(nextItems: LocalCartItem[]): CartItemWithProduct[] {
      return nextItems.map((item) => {
        const cached = productCacheRef.current.get(item.productId);
        const product = cached?.product ?? null;
        const inventoryEnabled = cached?.inventoryEnabled ?? true;

        const unitPrice = product
          ? product.hasOffer && product.offerPrice != null
            ? Number(product.offerPrice)
            : Number(product.price)
          : 0;
        const stockAvailable = product?.stockAvailable ?? 0;
        const stockReserved = product?.stockReserved ?? 0;
        const effectiveStock = Math.max(0, stockAvailable - stockReserved);

        let availabilityMessage = '';
        if (cached) {
          if (!product) availabilityMessage = 'El producto ya no existe.';
          else if (product.active === false) availabilityMessage = 'El producto ya no está activo.';
          else if (!inventoryEnabled) availabilityMessage = 'El producto no está disponible para venta.';
          else if (effectiveStock <= 0) availabilityMessage = 'Sin stock disponible.';
          else if (effectiveStock < item.quantity) availabilityMessage = `Stock insuficiente. Disponible: ${effectiveStock}.`;
          else if (!Number.isFinite(unitPrice) || unitPrice <= 0) availabilityMessage = 'El producto no tiene un precio válido.';
        }

        const isValid = cached ? availabilityMessage === '' : true;
        let priceChange: 'none' | 'increased' | 'decreased' = 'none';
        if (
          isValid &&
          cached &&
          typeof item.priceAtAdd === 'number' &&
          Number.isFinite(item.priceAtAdd) &&
          item.priceAtAdd > 0
        ) {
          const diff = Number((unitPrice - item.priceAtAdd).toFixed(2));
          if (diff > 0.009) priceChange = 'increased';
          else if (diff < -0.009) priceChange = 'decreased';
        }

        return {
          ...item,
          userId: uidRef.current ?? '',
          updatedAt: new Date(item.updatedAt),
          cartItemId: item.productId,
          product,
          included: true,
          priceAtAdd: item.priceAtAdd,
          unitPrice,
          isValid,
          availabilityMessage,
          priceChange,
        };
      });
    }

    function emit(nextItems: LocalCartItem[]) {
      if (cancelled) return;
      setItemsWithProducts(buildEnriched(nextItems));
      const waiting = nextItems.some((item) => !productCacheRef.current.has(item.productId));
      setLoading(waiting);
    }

    const itemIds = new Set(items.map((item) => item.productId));
    productCacheRef.current.forEach((_, productId) => {
      if (!itemIds.has(productId)) {
        productCacheRef.current.delete(productId);
      }
    });

    emit(items);

    if (items.length === 0) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const stateByProductId = new Map<
      string,
      {
        product: CartProduct | null;
        inventoryEnabled: boolean;
        hasProductSnapshot: boolean;
        hasInventorySnapshot: boolean;
      }
    >();

    const updateCache = (productId: string) => {
      const state = stateByProductId.get(productId);
      if (!state || !state.hasProductSnapshot || !state.hasInventorySnapshot) return;
      productCacheRef.current.set(productId, {
        product: state.product,
        inventoryEnabled: state.inventoryEnabled,
      });
      emit(items);
    };

    const unsubscribers = items.flatMap((item) => {
      const productId = item.productId;
      stateByProductId.set(productId, {
        product: null,
        inventoryEnabled: true,
        hasProductSnapshot: false,
        hasInventorySnapshot: false,
      });

      const productUnsub = onSnapshot(
        doc(db, 'products', productId),
        (productSnap) => {
          const currentState = stateByProductId.get(productId);
          if (!currentState) return;

          if (productSnap.exists()) {
            currentState.product = {
              id: productSnap.id,
              ...productSnap.data(),
              stockAvailable: currentState.product?.stockAvailable ?? 0,
              stockReserved: currentState.product?.stockReserved ?? 0,
              stockTotal: currentState.product?.stockTotal ?? 0,
            } as CartProduct;
          } else {
            currentState.product = null;
          }
          currentState.hasProductSnapshot = true;
          updateCache(productId);
        },
        () => {
          const currentState = stateByProductId.get(productId);
          if (!currentState) return;
          currentState.product = null;
          currentState.hasProductSnapshot = true;
          updateCache(productId);
        },
      );

      const inventoryUnsub = onSnapshot(
        query(
          collection(db, 'inventory'),
          where('productId', '==', productId),
          limit(1),
        ),
        (inventorySnap) => {
          const currentState = stateByProductId.get(productId);
          if (!currentState) return;

          const inventoryData = inventorySnap.empty ? null : inventorySnap.docs[0].data();
          currentState.inventoryEnabled = inventoryData ? inventoryData.enabled !== false : false;
          if (currentState.product) {
            currentState.product = {
              ...currentState.product,
              stockAvailable: inventoryData?.stockAvailable ?? 0,
              stockReserved: inventoryData?.stockReserved ?? 0,
              stockTotal: inventoryData?.stockTotal ?? 0,
            };
          }
          currentState.hasInventorySnapshot = true;
          updateCache(productId);
        },
        () => {
          const currentState = stateByProductId.get(productId);
          if (!currentState) return;
          currentState.inventoryEnabled = false;
          if (currentState.product) {
            currentState.product = {
              ...currentState.product,
              stockAvailable: 0,
              stockReserved: 0,
              stockTotal: currentState.product.stockTotal ?? 0,
            };
          }
          currentState.hasInventorySnapshot = true;
          updateCache(productId);
        },
      );

      return [productUnsub, inventoryUnsub];
    });

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [items]);

  const addToCart = useCallback(async (productId: string, stock: number, priceAtAdd?: number) => {
    setError(null);
    const result = addToLocalCart(productId, stock, priceAtAdd);
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
        try { await upsertCartItem(uidRef.current, productId, item.quantity, item.priceAtAdd); } catch {}
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
        try { await upsertCartItem(uidRef.current, productId, item.quantity, item.priceAtAdd); } catch {}
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

  const setQuantity = useCallback(async (productId: string, quantity: number, stock: number) => {
    setError(null);
    const result = setQuantityLocalCart(productId, quantity, stock);
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
        try { await upsertCartItem(uidRef.current, productId, item.quantity, item.priceAtAdd); } catch {}
      } else {
        try { await deleteCartItem(uidRef.current, productId); } catch {}
      }
    }
    return true;
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
    setQuantity,
    removeItem,
    clearError,
  };
}

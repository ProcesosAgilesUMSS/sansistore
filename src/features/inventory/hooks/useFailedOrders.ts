import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import {
  restoreStockForOrder,
  subscribeFailedOrders,
  type FailedOrder,
} from '../services/failedOrdersService';

interface UseFailedOrdersReturn {
  orders: FailedOrder[];
  loading: boolean;
  error: string | null;
  restoreError: string | null;
  restoringId: string | null;
  restoreStock: (order: FailedOrder) => Promise<void>;
  clearRestoreError: () => void;
}

export function useFailedOrders(): UseFailedOrdersReturn {
  const { user, authReady } = useAuthUser();
  const [orders, setOrders] = useState<FailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [roleData, setRoleData] = useState<{ loaded: boolean; isAdmin: boolean }>({
    loaded: false,
    isAdmin: false,
  });

  useEffect(() => {
    if (!authReady) return;
    if (user?.uid) {
      getDoc(doc(db, 'users', user.uid))
        .then((snap) => {
          const roles = snap.data()?.roles || [];
          setRoleData({ loaded: true, isAdmin: roles.includes('admin') });
        })
        .catch(() => {
          setRoleData({ loaded: true, isAdmin: false });
        });
    } else {
      setRoleData({ loaded: true, isAdmin: false });
    }
  }, [authReady, user?.uid]);

  useEffect(() => {
    if (!authReady || !roleData.loaded) return;

    // Si no es admin, filtramos automáticamente por su ID de vendedor
    const targetSellerId = !roleData.isAdmin && user?.uid ? user.uid : undefined;

    const unsub = subscribeFailedOrders(
      (failedOrders) => {
        setOrders(failedOrders);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      targetSellerId
    );

    return unsub;
  }, [authReady, roleData, user?.uid]);

  const restoreStock = useCallback(
    async (order: FailedOrder) => {
      if (!user?.uid) {
        setRestoreError('Debes iniciar sesión para reponer stock.');
        return;
      }
      setRestoreError(null);
      setRestoringId(order.id);
      try {
        await restoreStockForOrder(order, user.uid);
      } catch (err) {
        setRestoreError(
          err instanceof Error ? err.message : 'No se pudo reponer el stock.'
        );
      } finally {
        setRestoringId(null);
      }
    },
    [user?.uid]
  );

  const clearRestoreError = useCallback(() => {
    setRestoreError(null);
  }, []);

  return {
    orders,
    loading,
    error,
    restoreError,
    restoringId,
    restoreStock,
    clearRestoreError,
  };
}

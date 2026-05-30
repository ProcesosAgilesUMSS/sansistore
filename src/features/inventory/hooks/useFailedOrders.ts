import { useCallback, useEffect, useState } from 'react';
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
  restoringId: string | null;
  restoreStock: (order: FailedOrder) => Promise<void>;
}

export function useFailedOrders(): UseFailedOrdersReturn {
  const { user, authReady } = useAuthUser();
  const [orders, setOrders] = useState<FailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    const unsub = subscribeFailedOrders(
      (failedOrders) => {
        setOrders(failedOrders);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [authReady]);

  const restoreStock = useCallback(
    async (order: FailedOrder) => {
      if (!user?.uid) {
        setError('Debes iniciar sesión para reponer stock.');
        return;
      }
      setError(null);
      setRestoringId(order.id);
      try {
        await restoreStockForOrder(order, user.uid);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo reponer el stock.'
        );
      } finally {
        setRestoringId(null);
      }
    },
    [user?.uid]
  );

  return { orders, loading, error, restoringId, restoreStock };
}

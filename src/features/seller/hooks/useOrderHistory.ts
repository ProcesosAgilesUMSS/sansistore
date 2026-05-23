import { useEffect, useMemo, useState } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { subscribePaidOrders } from '../services/sellerServices';
import type { Order } from '../types';

interface UseOrderHistoryReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  totalCollected: number;
}

export function useOrderHistory(): UseOrderHistoryReturn {
  const { user, authReady } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const unsub = subscribePaidOrders(
      db,
      user.uid,
      (paidOrders) => {
        setOrders(paidOrders);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [authReady, user?.uid]);

  const totalCollected = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders],
  );

  return {
    orders,
    loading,
    error,
    totalCollected,
  };
}

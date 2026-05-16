import { useState, useEffect } from 'react';
import type { PendingOrder } from '../types/pendingOrders';
import { fetchPendingOrders } from '../services/pendingOrdersService';

interface UsePendingOrdersReturn {
  orders: PendingOrder[];
  loading: boolean;
  error: string | null;
}

export function usePendingOrders(): UsePendingOrdersReturn {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOrders()
      .then((data) => {
        setOrders(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { orders, loading, error };
}

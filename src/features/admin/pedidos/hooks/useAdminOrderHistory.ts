// src/features/admin/pedidos/hooks/useOrderHistory.ts

import { useState } from 'react';
import { getOrderHistory } from '../services/orderHistoryService';
import type { OrderHistory } from '../types';

interface UseOrderHistoryResult {
  data: OrderHistory | null;
  loading: boolean;
  error: string | null;
  search: (orderId: string) => Promise<void>;
  reset: () => void;
}

export function useOrderHistory(): UseOrderHistoryResult {
  const [data, setData] = useState<OrderHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(orderId: string) {
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getOrderHistory(orderId.trim());
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar el pedido');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
  }

  return { data, loading, error, search, reset };
}
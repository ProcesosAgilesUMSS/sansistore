// src/features/admin/pedidos/hooks/useOrdersList.ts

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import type { OrderSummary } from '../types';

async function getAuthorizationHeader(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        const token = await user.getIdToken();
        resolve({ Authorization: `Bearer ${token}` });
      } else {
        resolve({});
      }
    });
  });
}

interface UseOrdersListResult {
  orders: OrderSummary[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  filterByStatus: (status: string | null) => void;
  activeStatus: string | null;
}

export function useOrdersList(): UseOrdersListResult {
  const [orders, setOrders]           = useState<OrderSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(false);
  const [cursor, setCursor]           = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async (
    status: string | null,
    cursorId: string | null,
    append: boolean
  ) => {
    try {
      const headers = await getAuthorizationHeader();
      const params = new URLSearchParams({ limit: '20' });
      if (status)   params.set('status', status);
      if (cursorId) params.set('cursor', cursorId);

      const res = await fetch(`/api/admin/orders_list?${params}`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setOrders((prev) => append ? [...prev, ...data.orders] : data.orders);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar pedidos');
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOrders(activeStatus, null, false).finally(() => setLoading(false));
  }, [activeStatus, fetchOrders]);

  function loadMore() {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    fetchOrders(activeStatus, cursor, true).finally(() => setLoadingMore(false));
  }

  function filterByStatus(status: string | null) {
    setCursor(null);
    setActiveStatus(status);
  }

  return { orders, loading, loadingMore, error, hasMore, loadMore, filterByStatus, activeStatus };
}
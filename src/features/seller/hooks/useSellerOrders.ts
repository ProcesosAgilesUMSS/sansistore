
import { useState, useCallback, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useGetOrders } from './useGetOrders';
import { fetchOrderItems, markOrderAsReady } from '../services/sellerServices'
import type { Order, OrderItem } from '../types';

interface UseSellerOrdersReturn {
  reserved: Order[];
  ready: Order[];
  loading: boolean;
  error: string | null;
  expandedOrderId: string | null;
  expandedItems: OrderItem[];
  itemsLoading: boolean;
  toggleOrderDetail: (orderId: string) => void;
  markingOrderId: string | null;
  markAsReady: (orderId: string) => Promise<void>;
  successOrderId: string | null;
}

export function useSellerOrders(): UseSellerOrdersReturn {
  const { user } = useAuthUser();
  const { orders: reserved, loading: reservedLoading, error: reservedError } = useGetOrders({ status: 'EMPAQUETADO', ordby: 'desc' });
  const { orders: ready, loading: readyLoading, error: readyError } = useGetOrders({ status: 'LISTO', ordby: 'desc' });

  const loading = reservedLoading || readyLoading;
  const [actionError, setActionError] = useState<string | null>(null);
  const error = actionError ?? reservedError ?? readyError;

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [markingOrderId, setMarkingOrderId] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const itemsCache = useRef<Record<string, OrderItem[]>>({});

  const toggleOrderDetail = useCallback(async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setExpandedItems([]);
      return;
    }

    setExpandedOrderId(orderId);

    if (itemsCache.current[orderId]) {
      setExpandedItems(itemsCache.current[orderId]);
      return;
    }

    setItemsLoading(true);
    try {
      const items = await fetchOrderItems(db, orderId);
      itemsCache.current[orderId] = items;
      setExpandedItems(items);
    } catch {
      setActionError('No se pudieron cargar los productos del pedido.');
    } finally {
      setItemsLoading(false);
    }
  }, [expandedOrderId]);

  const markAsReady = useCallback(async (orderId: string) => {
    if (!user?.uid) return;

    setMarkingOrderId(orderId);
    setActionError(null);
    try {
      await markOrderAsReady(db, orderId, user.uid);
      setSuccessOrderId(orderId);
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
        setExpandedItems([]);
      }
      setTimeout(() => setSuccessOrderId(null), 3000);
    } catch {
      setActionError('Error al marcar el pedido como listo.');
    } finally {
      setMarkingOrderId(null);
    }
  }, [expandedOrderId, user?.uid]);

  return {
    reserved,
    ready,
    loading,
    error,
    expandedOrderId,
    expandedItems,
    itemsLoading,
    toggleOrderDetail,
    markingOrderId,
    markAsReady,
    successOrderId,
  };
}


import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { subscribeSellerOrders, fetchOrderItems, markOrderAsReady } from '../services/sellerServices'
import type { Order, OrderItem } from '../types';

const TEMP_SELLER_ID = 'user-vendedor-001';

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
  const [reserved, setReserved] = useState<Order[]>([]);
  const [ready, setReady] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [markingOrderId, setMarkingOrderId] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const itemsCache = useRef<Record<string, OrderItem[]>>({});

  useEffect(() => {
    const unsub = subscribeSellerOrders(
      db,
      TEMP_SELLER_ID,
      (res, rdy) => {
        setReserved(res);
        setReady(rdy);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

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
      setError('No se pudieron cargar los productos del pedido.');
    } finally {
      setItemsLoading(false);
    }
  }, [expandedOrderId]);

  const markAsReady = useCallback(async (orderId: string) => {
    setMarkingOrderId(orderId);
    setError(null);
    try {
      await markOrderAsReady(db, orderId, TEMP_SELLER_ID);
      setSuccessOrderId(orderId);
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
        setExpandedItems([]);
      }
      setTimeout(() => setSuccessOrderId(null), 3000);
    } catch {
      setError('Error al marcar el pedido como listo.');
    } finally {
      setMarkingOrderId(null);
    }
  }, [expandedOrderId]);

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

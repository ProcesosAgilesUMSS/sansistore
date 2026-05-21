import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import {
  fetchOrderItems,
  reserveConfirmedOrder,
  subscribeConfirmedOrders,
  subscribeReservedOrders,
} from '../services/sellerServices';
import type { Order, OrderItem } from '../types';

interface UseReservedOrdersPanelReturn {
  confirmed: Order[];
  reserved: Order[];
  loading: boolean;
  error: string | null;
  expandedOrderId: string | null;
  expandedItems: OrderItem[];
  itemsLoading: boolean;
  toggleOrderDetail: (orderId: string) => void;
  reservingOrderId: string | null;
  reserveOrder: (orderId: string) => Promise<void>;
  successOrderId: string | null;
}

export function useReservedOrdersPanel(): UseReservedOrdersPanelReturn {
  const { user, authReady } = useAuthUser();
  const [confirmed, setConfirmed] = useState<Order[]>([]);
  const [reserved, setReserved] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [reservingOrderId, setReservingOrderId] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const itemsCache = useRef<Record<string, OrderItem[]>>({});

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setConfirmed([]);
      setReserved([]);
      setLoading(false);
      return;
    }

    let confirmedLoaded = false;
    let reservedLoaded = false;
    const markLoaded = () => {
      if (confirmedLoaded && reservedLoaded) {
        setLoading(false);
      }
    };

    const unsubConfirmed = subscribeConfirmedOrders(
      db,
      user.uid,
      (orders) => {
        confirmedLoaded = true;
        setConfirmed(orders);
        markLoaded();
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    const unsubReserved = subscribeReservedOrders(
      db,
      user.uid,
      (orders) => {
        reservedLoaded = true;
        setReserved(orders);
        markLoaded();
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubConfirmed();
      unsubReserved();
    };
  }, [authReady, user?.uid]);

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

  const reserveOrder = useCallback(async (orderId: string) => {
    if (!user?.uid) return;

    setReservingOrderId(orderId);
    setError(null);
    try {
      await reserveConfirmedOrder(db, orderId, user.uid);
      setSuccessOrderId(orderId);
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
        setExpandedItems([]);
      }
      setTimeout(() => setSuccessOrderId(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar el pedido.');
    } finally {
      setReservingOrderId(null);
    }
  }, [expandedOrderId, user?.uid]);

  return {
    confirmed,
    reserved,
    loading,
    error,
    expandedOrderId,
    expandedItems,
    itemsLoading,
    toggleOrderDetail,
    reservingOrderId,
    reserveOrder,
    successOrderId,
  };
}

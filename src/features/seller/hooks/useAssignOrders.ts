import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import type { Order, Messenger } from '../types';
import {
  subscribeSellerOrders,
  subscribeAssignedOrders,
  subscribeRejectedOrders,
  fetchMessengers,
  assignCourierToDelivery,
  unassignCourierFromDelivery,
} from '../services/sellerServices';

export function useAssignOrders() {
  const { user, authReady } = useAuthUser();
  const [ready, setReady] = useState<Order[]>([]);
  const [assigned, setAssigned] = useState<Order[]>([]);
  const [rejected, setRejected] = useState<Order[]>([]);
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [messengersLoading, setMessengersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setReady([]);
      setAssigned([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeSellerOrders(
      db,
      user.uid,
      (_reserved, readyOrders) => {
        setReady(readyOrders);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [authReady, user?.uid]);

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setAssigned([]);
      return;
    }

    const unsub = subscribeAssignedOrders(
      db,
      user.uid,
      (assignedOrders) => setAssigned(assignedOrders),
      (err) => setError(err.message),
    );
    return unsub;
  }, [authReady, user?.uid]);

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setRejected([]);
      return;
    }

    const unsub = subscribeRejectedOrders(
      db,
      user.uid,
      (orders) => {
        console.debug('[useAssignOrders] rejected subscription update, count:', orders.length);
        setRejected(orders);
        setLoading(false);
      },
      (err) => {
        console.error('[useAssignOrders] rejected subscription error:', err);
        setError(err.message);
      },
    );

    return unsub;
  }, [authReady, user?.uid]);

  useEffect(() => {
    fetchMessengers(db)
      .then((list) => setMessengers(list))
      .catch(() => setError('No se pudieron cargar los mensajeros.'))
      .finally(() => setMessengersLoading(false));
  }, []);

  const reassignOrder = useCallback(
    async (orderId: string, deliveryId: string, newCourierId: string) => {
      if (!newCourierId || !deliveryId) return;

      setAssigningOrderId(orderId);
      try {
        const { reassignCourierToDelivery } = await import('../services/sellerServices');
        await reassignCourierToDelivery(db, deliveryId, orderId, newCourierId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al reasignar mensajero.');
      } finally {
        setAssigningOrderId(null);
      }
    },
    [],
  );

  const reassignFromPending = useCallback(
    async (orderId: string, deliveryId: string, newCourierId: string) => {
      if (!newCourierId || !deliveryId) return;

      setAssigningOrderId(orderId);
      try {
        const { reassignCourierFromPending } = await import('../services/sellerServices');
        await reassignCourierFromPending(db, deliveryId, orderId, newCourierId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al reasignar mensajero.');
      } finally {
        setAssigningOrderId(null);
      }
    },
    [],
  );

  const selectCourier = useCallback((orderId: string, courierId: string) => {
    setSelectedCourier((prev) => ({ ...prev, [orderId]: courierId }));
  }, []);

  const assignOrder = useCallback(
    async (orderId: string, deliveryId: string) => {
      const courierId = selectedCourier[orderId];
      if (!courierId || !deliveryId) return;

      setAssigningOrderId(orderId);
      try {
        await assignCourierToDelivery(db, deliveryId, orderId, courierId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al asignar mensajero.');
      } finally {
        setAssigningOrderId(null);
      }
    },
    [selectedCourier],
  );

  const unassignOrder = useCallback(async (orderId: string, deliveryId: string) => {
    setAssigningOrderId(orderId);
    try {
      await unassignCourierFromDelivery(db, deliveryId, orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la asignación.');
    } finally {
      setAssigningOrderId(null);
    }
  }, []);

  return {
    ready,
    assigned,
    rejected,
    messengers,
    loading,
    messengersLoading,
    error,
    selectedCourier,
    selectCourier,
    assigningOrderId,
    assignOrder,
    unassignOrder,
    reassignOrder,
    reassignFromPending,
  };
}

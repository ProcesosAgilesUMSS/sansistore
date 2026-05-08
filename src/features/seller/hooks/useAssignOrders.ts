import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/firebase';
import type { Order, Messenger } from '../types';
import {
  subscribeSellerOrders,
  subscribeAssignedOrders,
  fetchMessengers,
  assignCourierToDelivery,
  unassignCourierFromDelivery,
} from '../services/sellerServices';

const TEMP_SELLER_ID = 'user-vendedor-001';

export function useAssignOrders() {
  const [ready, setReady] = useState<Order[]>([]);
  const [assigned, setAssigned] = useState<Order[]>([]);
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [messengersLoading, setMessengersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeSellerOrders(
      db,
      TEMP_SELLER_ID,
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
  }, []);

  useEffect(() => {
    const unsub = subscribeAssignedOrders(
      db,
      TEMP_SELLER_ID,
      (assignedOrders) => setAssigned(assignedOrders),
      (err) => setError(err.message),
    );
    return unsub;
  }, []);

  useEffect(() => {
    fetchMessengers(db)
      .then((list) => setMessengers(list))
      .catch(() => setError('No se pudieron cargar los mensajeros.'))
      .finally(() => setMessengersLoading(false));
  }, []);

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
    messengers,
    loading,
    messengersLoading,
    error,
    selectedCourier,
    selectCourier,
    assigningOrderId,
    assignOrder,
    unassignOrder,
  };
}

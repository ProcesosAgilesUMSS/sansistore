import { useEffect, useState } from 'react';
import { getMessengerOrders } from '../services/messengerOrdersService';
import type { DeliveryOrder } from '../types';

export function useMessengerOrders(messengerId: string) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getMessengerOrders(messengerId)
      .then((nextOrders) => {
        if (!cancelled) {
          setOrders(nextOrders);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudieron cargar los pedidos asignados.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [messengerId]);

  return {
    orders,
    loading,
    error,
  };
}

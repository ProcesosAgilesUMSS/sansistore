import { useEffect, useState } from 'react';
import {
  acceptMessengerOrder,
  getMessengerOrders,
  rejectMessengerOrder,
} from '../services/messengerOrdersService';
import type { DeliveryOrder } from '../types';

export function useMessengerOrders(messengerId: string) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

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

  const acceptOrder = async (orderId: string) => {
    setActiveOrderId(orderId);
    setError(null);

    try {
      const updatedOrder = await acceptMessengerOrder(orderId, messengerId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? updatedOrder : order,
        ),
      );
    } catch (acceptError) {
      if (acceptError instanceof Error) {
        setError(acceptError.message);
      } else {
        setError('No se pudo aceptar el pedido.');
      }
    } finally {
      setActiveOrderId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    setActiveOrderId(orderId);
    setError(null);

    try {
      const updatedOrder = await rejectMessengerOrder(orderId, messengerId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? updatedOrder : order,
        ),
      );
    } catch (rejectError) {
      if (rejectError instanceof Error) {
        setError(rejectError.message);
      } else {
        setError('No se pudo rechazar el pedido.');
      }
    } finally {
      setActiveOrderId(null);
    }
  };

  return {
    orders,
    loading,
    error,
    activeOrderId,
    acceptOrder,
    rejectOrder,
  };
}

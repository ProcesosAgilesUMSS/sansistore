import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { markOrderReady } from '../services/markOrderReady';
import { useState } from 'react';

interface ReturnType {
  markAsReady: (orderId: string) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  reset: () => void;
  currentOrderId: string | null;
}

export const useMarkOrderReady = (): ReturnType => {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthUser();

  const reset = () => {
    setCurrentOrderId(null);
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }

  const markAsReady = async (orderId: string) => {
    if (!user?.uid) {
      setError('Usuario no autenticado');
      return;
    }
    setCurrentOrderId(orderId);
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);
    try {
      await markOrderReady(db, orderId, user.uid);
      setIsSuccess(true);

      setTimeout(() => {
        if (currentOrderId === orderId) {
          setIsSuccess(false);
        }
      }, 3000);
    } catch {
      setError('Error al marcar el pedido como listo.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    markAsReady,
    isLoading,
    isSuccess,
    error,
    reset,
    currentOrderId,
  }
}

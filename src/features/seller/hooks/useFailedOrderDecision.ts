import { useCallback, useState } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import {
  cancelFailedOrder,
  restartFailedOrder,
} from '../services/failedOrderDecisionService';

export function useFailedOrderDecision() {
  const { user } = useAuthUser();
  const [loadingAction, setLoadingAction] = useState<{
    orderId: string;
    action: 'restart' | 'cancel';
  } | null>(null);
  const [successAction, setSuccessAction] = useState<{
    orderId: string;
    action: 'restart' | 'cancel';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restartOrder = useCallback(
    async (orderId: string) => {
      if (!user?.uid) {
        setError('Debes iniciar sesión para reiniciar pedidos.');
        return;
      }

      setLoadingAction({ orderId, action: 'restart' });
      setError(null);

      try {
        await restartFailedOrder(db, orderId, user.uid);
        setSuccessAction({ orderId, action: 'restart' });
        setTimeout(() => setSuccessAction(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo reiniciar el pedido.',
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [user?.uid],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!user?.uid) {
        setError('Debes iniciar sesión para cancelar pedidos.');
        return;
      }

      setLoadingAction({ orderId, action: 'cancel' });
      setError(null);

      try {
        await cancelFailedOrder(db, orderId, user.uid);
        setSuccessAction({ orderId, action: 'cancel' });
        setTimeout(() => setSuccessAction(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo cancelar el pedido.',
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [user?.uid],
  );

  return {
    loadingAction,
    successAction,
    error,
    restartOrder,
    cancelOrder,
  };
}

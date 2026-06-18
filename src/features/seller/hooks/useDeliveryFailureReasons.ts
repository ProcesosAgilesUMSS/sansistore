import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useGetOrders } from './useGetOrders';
import {
  DELIVERY_FAILURE_REASONS_COLLECTION,
  registerDeliveryFailureReason,
  type DeliveryFailureReason,
  type DeliveryFailureReasonRecord,
} from '../services/deliveryFailureReasonsService';
import type { Order } from '../types';

interface RegisterParams {
  order: Order;
  reason: DeliveryFailureReason;
  description?: string;
}

function toMillis(value: Timestamp | null | undefined) {
  return value?.toMillis?.() ?? 0;
}

export function useDeliveryFailureReasons() {
  const { user, authReady } = useAuthUser();
  const {
    orders: returnedOrders,
    loading: loadingOrders,
    error: ordersError,
  } = useGetOrders({ status: 'DEVUELTO', ordby: 'desc' });

  const [registeredReasons, setRegisteredReasons] = useState<DeliveryFailureReasonRecord[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [reasonsError, setReasonsError] = useState<string | null>(null);
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setRegisteredReasons([]);
      setLoadingReasons(false);
      return;
    }

    setLoadingReasons(true);
    setReasonsError(null);

    const q = query(
      collection(db, DELIVERY_FAILURE_REASONS_COLLECTION),
      where('sellerId', '==', user.uid),
    );

    return onSnapshot(
      q,
      (snap) => {
        const nextReasons = snap.docs
          .map((reasonDoc) => ({
            id: reasonDoc.id,
            ...(reasonDoc.data() as Omit<DeliveryFailureReasonRecord, 'id'>),
          }))
          .sort((a, b) => toMillis(b.registeredAt) - toMillis(a.registeredAt));

        setRegisteredReasons(nextReasons);
        setLoadingReasons(false);
      },
      () => {
        setReasonsError('Ocurrio un error al cargar los motivos registrados.');
        setLoadingReasons(false);
      },
    );
  }, [authReady, user?.uid]);

  const ordersAwaitingReason = useMemo(() => {
    const registeredOrderIds = new Set(registeredReasons.map((reason) => reason.orderId));
    return returnedOrders.filter((order) => !registeredOrderIds.has(order.orderId));
  }, [registeredReasons, returnedOrders]);

  const registerReason = useCallback(
    async ({ order, reason, description }: RegisterParams) => {
      if (!user?.uid) {
        setSubmitError('Debes iniciar sesion para registrar motivos.');
        return false;
      }

      setSubmittingOrderId(order.orderId);
      setSubmitError(null);

      try {
        await registerDeliveryFailureReason({
          db,
          orderId: order.orderId,
          sellerId: user.uid,
          sellerName: user.displayName ?? user.email ?? 'Vendedor',
          buyerId: order.buyerId,
          buyerName: order.buyerName,
          reason,
          description,
        });
        return true;
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'No se pudo guardar el motivo.',
        );
        return false;
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [user?.displayName, user?.email, user?.uid],
  );

  return {
    authReady,
    user,
    returnedOrders,
    ordersAwaitingReason,
    registeredReasons,
    loading: loadingOrders || loadingReasons,
    loadingOrders,
    loadingReasons,
    error: ordersError || reasonsError || submitError,
    submitError,
    submittingOrderId,
    registerReason,
    clearSubmitError: () => setSubmitError(null),
  };
}

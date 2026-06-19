import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useGetOrders } from './useGetOrders';
import {
  DELIVERY_FAILURE_ORDER_STATUS,
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

export interface CustomerReturnReasonRecord {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: Timestamp | null;
  source: 'customer';
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
  } = useGetOrders({ status: DELIVERY_FAILURE_ORDER_STATUS, ordby: 'desc' });

  const [registeredReasons, setRegisteredReasons] = useState<DeliveryFailureReasonRecord[]>([]);
  const [customerReturnReasons, setCustomerReturnReasons] = useState<CustomerReturnReasonRecord[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [loadingCustomerReturns, setLoadingCustomerReturns] = useState(true);
  const [reasonsError, setReasonsError] = useState<string | null>(null);
  const [customerReturnsError, setCustomerReturnsError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setCustomerReturnReasons([]);
      setLoadingCustomerReturns(false);
      return;
    }

    setLoadingCustomerReturns(true);
    setCustomerReturnsError(null);

    const q = query(
      collection(db, 'returns'),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        const sellerOrderIds = new Set(returnedOrders.map((order) => order.orderId));
        const nextReasons = snap.docs
          .map((returnDoc) => ({
            id: returnDoc.id,
            ...(returnDoc.data() as Omit<CustomerReturnReasonRecord, 'id' | 'source'>),
            source: 'customer' as const,
          }))
          .filter((returnReq) => sellerOrderIds.has(returnReq.orderId))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setCustomerReturnReasons(nextReasons);
        setLoadingCustomerReturns(false);
      },
      () => {
        setCustomerReturnsError('Ocurrio un error al cargar las devoluciones del cliente.');
        setLoadingCustomerReturns(false);
      },
    );
  }, [authReady, returnedOrders, user?.uid]);

  const ordersAwaitingReason = useMemo(() => {
    const registeredOrderIds = new Set(registeredReasons.map((reason) => reason.orderId));
    const customerReturnOrderIds = new Set(
      customerReturnReasons.map((reason) => reason.orderId),
    );

    return returnedOrders.filter(
      (order) =>
        !registeredOrderIds.has(order.orderId) &&
        !customerReturnOrderIds.has(order.orderId),
    );
  }, [customerReturnReasons, registeredReasons, returnedOrders]);

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
    customerReturnReasons,
    loading: loadingOrders || loadingReasons || loadingCustomerReturns,
    loadingOrders,
    loadingReasons,
    loadingCustomerReturns,
    error: ordersError || reasonsError || customerReturnsError || submitError,
    submitError,
    submittingOrderId,
    registerReason,
    clearSubmitError: () => setSubmitError(null),
  };
}

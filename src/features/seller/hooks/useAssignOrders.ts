import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/firebase';
import type { Order, Messenger } from '../types';
import { useGetOrders } from './useGetOrders';
import {
    fetchMessengers,
    assignCourierToDelivery,
    unassignCourierFromDelivery,
} from '../services/sellerServices';

export function useAssignOrders() {
    const { orders: ready, loading: readyLoading, error: readyError } = useGetOrders({ status: 'LISTO', ordby: 'desc' });
    const { orders: assigned, loading: assignedLoading, error: assignedError } = useGetOrders({ status: 'ASIGNADO', ordby: 'desc' });
    const { orders: rejected, loading: rejectedLoading, error: rejectedError } = useGetOrders({ status: 'PENDIENTE REASIGNACION', ordby: 'desc' });

    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [messengersLoading, setMessengersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});
    const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

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

    const loading = readyLoading || assignedLoading || rejectedLoading;
    const subscriptionError = readyError ?? assignedError ?? rejectedError;

    return {
        ready,
        assigned,
        rejected,
        messengers,
        loading,
        messengersLoading,
        error: error ?? subscriptionError,
        selectedCourier,
        selectCourier,
        assigningOrderId,
        assignOrder,
        unassignOrder,
        reassignOrder,
        reassignFromPending,
    };
}
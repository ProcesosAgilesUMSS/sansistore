import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import type { Order } from '../types';
import { getOrders } from '../services/getOrders';

interface UseGetOrdersParams {
    status: string;
    ordby?: 'asc' | 'desc';
}

interface UseGetOrdersReturn {
    orders: Order[];
    loading: boolean;
    error: string | null;
}

export function useGetOrders({ status, ordby = 'desc' }: UseGetOrdersParams): UseGetOrdersReturn {
    const { user, authReady } = useAuthUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authReady) return;

        if (!user?.uid) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsub = getOrders({
            status,
            ordby,
            db,
            sellerId: user.uid,
            onData: (nextOrders) => {
                setOrders(nextOrders);
                setLoading(false);
            },
            onError: (message) => {
                setError(message);
                setLoading(false);
            },
        });

        return unsub;
    }, [authReady, ordby, status, user?.uid]);

    return { orders, loading, error };
}

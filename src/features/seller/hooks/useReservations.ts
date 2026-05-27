import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { subscribeReservations } from '../services/reservationsService';
import type { Order } from '../types';

const TEMP_SELLER_ID = 'user-pedro';

interface UseReservationsReturn {
  reservations: Order[];
  loading: boolean;
  error: string | null;
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeReservations(
      db,
      TEMP_SELLER_ID,
      (currentReservations) => {
        setReservations(currentReservations);
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar las reservas existentes.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    reservations,
    loading,
    error,
  };
}

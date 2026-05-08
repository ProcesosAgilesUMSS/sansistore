import { useState, useEffect } from 'react';
import { subscribeToUserLocations } from '../services/locationService';
import type { Location } from '../types';

export function useUserLocation(userId: string | null) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLocations([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsub = subscribeToUserLocations(userId, (data) => {
            setLocations(data);
            setLoading(false);
        });

        return unsub;
    }, [userId]);

    return { locations, loading };
}

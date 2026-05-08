import { useState } from 'react';
import { setDefaultLocation } from '../services/locationService';

export function useSetDefaultLocation() {
    const [loading, setLoading] = useState(false);

    const handleSetDefault = async (userId: string, locationId: string) => {
        setLoading(true);
        try {
            await setDefaultLocation(userId, locationId);
        } catch (e) {
            console.error('Error al establecer predeterminada:', e);
        } finally {
            setLoading(false);
        }
    };

    return { handleSetDefault, loading };
}

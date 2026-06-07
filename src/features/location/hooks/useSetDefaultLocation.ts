import { useState } from 'react';
import { setDefaultLocation } from '../services/locationService';

export function useSetDefaultLocation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // <-- Nuevo estado para capturar el error

    const handleSetDefault = async (userId: string, locationId: string) => {
        setLoading(true);
        setError(null);
        try {
            await setDefaultLocation(userId, locationId);
            return true;
        } catch (e) {
            console.error('Error al establecer predeterminada:', e);
            setError(e instanceof Error ? e.message : 'No se pudo establecer la ubicación como predeterminada.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { handleSetDefault, loading, error, clearError: () => setError(null) };
}

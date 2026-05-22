import { useState } from 'react';
import { deleteLocation, hasActiveOrders } from '../services/locationService';

export function useDeleteLocation() {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeleting(true);
        setError(null);
        
        try {
            const hasActive = await hasActiveOrders(id);
            if (hasActive) {
                throw new Error('No se puede eliminar esta ubicación porque tiene pedidos pendientes o en camino');
            }
            await deleteLocation(id);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error al eliminar ubicación';
            setError(message);
            console.error('Error al eliminar ubicación:', e);
            throw e;
        } finally {
            setDeleting(false);
        }
    };

    return { handleDelete, deleting, error };
}
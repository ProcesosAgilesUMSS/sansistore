import { useState } from 'react';
import { deleteLocation } from '../services/locationService';

export function useDeleteLocation() {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (id: string) => {
        setDeleting(true);
        try {
            await deleteLocation(id);
        } catch (e) {
            console.error('Error al eliminar ubicación:', e);
        } finally {
            setDeleting(false);
        }
    };

    return { handleDelete, deleting };
}

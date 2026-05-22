import { useState } from "react";
import { updateLocation, hasActiveOrders } from "../services/locationService";
import { useZoneValidation } from "./useZoneValidation";
import type { LocationType } from "../types";

export function useEditLocation(onSuccess?: () => void) {
    const [isEditing, setIsEditing] = useState(false);
    const { validateBeforeSave } = useZoneValidation();

    const handleEdit = async (
        locationId: string,
        lat: number,
        lng: number,
        label: string,
        type: LocationType
    ) => {
        if (!validateBeforeSave(lat, lng)) return;

        setIsEditing(true);
        try {
            const hasActive = await hasActiveOrders(locationId);
            if (hasActive) {
                throw new Error('No se puede editar esta ubicación porque tiene pedidos pendientes o en camino');
            }
            await updateLocation(locationId, { lat, lng, label, type });
            onSuccess?.();
        } catch (err) {
            console.error("Error editing location:", err);
            throw err;
        } finally {
            setIsEditing(false);
        }
    };

    return { handleEdit, isEditing };
}
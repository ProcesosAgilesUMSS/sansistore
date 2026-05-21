// src/features/location/hooks/useEditLocation.ts

import { useState } from "react";
import { updateLocation } from "../services/locationService";
import { useZoneValidation } from "./useZoneValidation";
import type { LocationType } from "../types";

export function useEditLocation(onSuccess?: () => void) {
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { validateBeforeSave } = useZoneValidation();

    const handleEdit = async (
        locationId: string,
        lat: number,
        lng: number,
        label: string,
        type: LocationType
    ) => {
        // Validar que la ubicación esté dentro de la zona permitida
        if (!validateBeforeSave(lat, lng)) return;

        setIsEditing(true);
        setError(null);

        try {
            await updateLocation(locationId, {
                lat,
                lng,
                label,
                type,
            });
            onSuccess?.(); // Refrescar la lista de ubicaciones
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al actualizar ubicación";
            setError(message);
            console.error("Error editing location:", err);
            throw err;
        } finally {
            setIsEditing(false);
        }
    };

    return { handleEdit, isEditing, error };
}
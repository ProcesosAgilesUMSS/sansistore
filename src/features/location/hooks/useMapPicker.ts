// src/features/location/hooks/useMapPicker.ts

import { useEffect } from "react";
import { useLocation } from "./useLocation";
import { useZoneValidation } from "./useZoneValidation";
import { useSaveLocation } from "./useSaveLocation";
import { useEditLocation } from "./useEditLocation"; 
import type { Location } from "../types";

// NUEVA PROPS: editingLocation (si viene, estamos editando)
interface UseMapPickerProps {
    editingLocation?: Location | null;
    onSuccess?: () => void; // para refrescar la lista después de editar
}

export function useMapPicker({ editingLocation, onSuccess }: UseMapPickerProps = {}) {
    const {
        lat,
        lng,
        label,
        type,
        setLat,
        setLng,
        setLabel,
        setType,
    } = useLocation();

    const {
        errorMessage,
        showError,
        validateLocation,
        allowedZones,
    } = useZoneValidation();

    const { handleSave: saveNew } = useSaveLocation();
    const { handleEdit: saveEdit, isEditing } = useEditLocation(onSuccess);

    const isEditMode = !!editingLocation;

    useEffect(() => {
        if (editingLocation) {
            setLat(editingLocation.lat);
            setLng(editingLocation.lng);
            setLabel(editingLocation.label);
            setType(editingLocation.type);
            validateLocation(editingLocation.lat, editingLocation.lng);
        }
    }, [editingLocation]); // Solo se ejecuta cuando cambia editingLocation

    const handleLocationChange = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);
        validateLocation(newLat, newLng);
    };

    const mapCenter: [number, number] =
        allowedZones.length > 0 && allowedZones[0].points.length > 0
            ? allowedZones[0].points[0]
            : (editingLocation ? [editingLocation.lat, editingLocation.lng] : [lat, lng]);

    const handleSave = async () => {
        if (isEditMode && editingLocation?.id) {
            await saveEdit(editingLocation.id, lat, lng, label, type);
        } else {
            await saveNew(lat, lng, label, type);
        }
    };

    return {
        // Coordenadas y formulario
        lat,
        lng,
        label,
        type,
        setLabel,
        setType,

        // Mapa
        mapCenter,
        handleLocationChange,

        // Error
        showError,
        errorMessage,

        // Zonas
        allowedZones,

        // Guardar
        handleSave,

        isSaving: isEditing,
        isEditMode,
    };
}
import { useCallback } from "react";
import { saveLocation } from "../services/locationService";
import { useZoneValidation } from "./useZoneValidation";
import { useAuthUser } from "../../../hooks/useAuthUser";
import type { LocationType } from "../types";
 
export function useSaveLocation() {
    const { validateBeforeSave, getSuccessMessage } = useZoneValidation();
    const { user } = useAuthUser();
 
    const handleSave = useCallback(
        async (lat: number, lng: number, label: string, type: LocationType) => {
            if (!validateBeforeSave(lat, lng)) return;
 
            const payload = {
                userId: user?.uid ?? "",
                lat,
                lng,
                label,
                type,
                isDefault: false,
            };
 
            await saveLocation(payload);
        },
        [user, validateBeforeSave, getSuccessMessage]
    );
 
    return { handleSave };
}
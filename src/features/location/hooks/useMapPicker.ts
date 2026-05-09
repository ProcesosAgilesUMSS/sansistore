import { useLocation } from "./useLocation";
import { useZoneValidation } from "./useZoneValidation";
import { useSaveLocation } from "./useSaveLocation";
 
export function useMapPicker() {
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
 
    const { handleSave: save } = useSaveLocation();
 
    // Cuando el usuario clickea el mapa: actualiza coordenadas y valida
    const handleLocationChange = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);
        validateLocation(newLat, newLng);
    };
 
    // Punto central del mapa al cargar
    const mapCenter: [number, number] =
        allowedZones.length > 0 && allowedZones[0].points.length > 0
            ? allowedZones[0].points[0]
            : [lat, lng];
 
    const handleSave = () => save(lat, lng, label, type);
 
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
    };
}
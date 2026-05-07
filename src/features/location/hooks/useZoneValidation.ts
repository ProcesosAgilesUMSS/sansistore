import { useState, useCallback } from "react";
import { isLocationValid, getCurrentZone, ALLOWED_ZONES } from "../utils/zoneLimits";

export function useZoneValidation() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  const validateLocation = useCallback((lat: number, lng: number): boolean => {
    const isValid = isLocationValid(lat, lng);
    
    if (!isValid) {
      const zonesList = ALLOWED_ZONES.map(z => `• ${z.name}`).join('\n');
      setErrorMessage(
        `Ubicación fuera de zonas permitidas.\n\nLas zonas permitidas son:\n${zonesList}`
      );
      setShowError(true);
      
      setTimeout(() => {
        setShowError(false);
      }, 4000);
    } else {
      setErrorMessage("");
      setShowError(false);
    }
    
    return isValid;
  }, []);

  const validateBeforeSave = useCallback((lat: number, lng: number): boolean => {
    const isValid = isLocationValid(lat, lng);
    
    if (!isValid) {
      setErrorMessage("No se puede guardar: La ubicación está fuera de las zonas permitidas");
      setShowError(true);
      
      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
    
    return isValid;
  }, []);

  const getSuccessMessage = useCallback((lat: number, lng: number): string => {
    const zone = getCurrentZone(lat, lng);
    return `Ubicación guardada correctamente en ${zone}`;
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage("");
    setShowError(false);
  }, []);

  return {
    errorMessage,
    showError,
    validateLocation,
    validateBeforeSave,
    getSuccessMessage,
    clearError,
    allowedZones: ALLOWED_ZONES,
  };
}
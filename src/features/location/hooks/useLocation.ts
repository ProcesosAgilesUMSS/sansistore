import { useState } from "react";
import type { LocationType } from "../types";

export function useLocation() {
  const [lat, setLat] = useState<number>(-17.3940);
  const [lng, setLng] = useState<number>(-66.1473);

  const [label, setLabel] = useState<string>("");
  const [type, setType] = useState<LocationType>("AULA");

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  };

  return {
    lat,
    lng,
    label,
    type,

    setLat,
    setLng,
    setLabel,
    setType,

    getCurrentLocation,
  };
}
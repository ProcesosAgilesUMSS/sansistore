// components/MapPicker.tsx
import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from "react-leaflet";
import { useLocation } from "../hooks/useLocation";
import { useZoneValidation } from "../hooks/useZoneValidation";
import { saveLocation } from "../services/locationService";
import type { LocationType } from "../types";
import "leaflet/dist/leaflet.css";

type MapEventsProps = {
  setLat: React.Dispatch<React.SetStateAction<number>>;
  setLng: React.Dispatch<React.SetStateAction<number>>;
  onLocationChange: (lat: number, lng: number) => void;
};

function MapEvents({ setLat, setLng, onLocationChange }: MapEventsProps) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
      setLat(lat);
      setLng(lng);
    },
  });

  return null;
}

export default function MapPicker() {
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
    validateBeforeSave,
    getSuccessMessage,
    allowedZones,
  } = useZoneValidation();

  const mapCenter: [number, number] = allowedZones.length > 0 && allowedZones[0].points.length > 0
    ? allowedZones[0].points[0]
    : [lat, lng];

  const handleLocationChange = (newLat: number, newLng: number) => {
    validateLocation(newLat, newLng);
  };

  const handleSave = async () => {
    if (!validateBeforeSave(lat, lng)) {
      return;
    }

    const payload = {
      userId: "TEMP_USER",
      lat,
      lng,
      label,
      type,
      isDefault: true,
    };

    try {
      await saveLocation(payload);
      alert(getSuccessMessage(lat, lng));
    } catch (err) {
      console.error("ERROR:", err);
      alert("Error al guardar la ubicación");
    }
  };

  return (
    <div
      style={{
        background: "var(--theme-card-bg)",
        color: "var(--theme-text)",
        padding: "16px",
        borderRadius: "1.25rem",
        border: "1px solid var(--theme-border)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <h1 style={{ fontWeight: 800 }}>
        Seleccionar ubicacion
      </h1>

      {showError && errorMessage && (
        <div
          style={{
            background: "#ff4444",
            color: "white",
            padding: "12px",
            borderRadius: "12px",
            marginBottom: "10px",
            fontSize: "14px",
            whiteSpace: "pre-line",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          background: "var(--theme-secondary-bg)",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          marginBottom: "8px",
        }}
      >
        <strong>Zonas permitidas:</strong>
        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
          {allowedZones.map((zone, idx) => (
            <li key={idx}>
              <strong>{zone.name}</strong>
              <br />
              <small style={{ opacity: 0.7 }}>
                Área definida por {zone.points.length} puntos
              </small>
            </li>
          ))}
        </ul>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{
          height: "320px",
          borderRadius: "1.25rem",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {allowedZones.map((zone, idx) => (
          <Polygon
            key={idx}
            positions={zone.points}
            pathOptions={{
              color: idx === 0 ? "#4CAF50" : "#2196F3",
              fillColor: idx === 0 ? "#4CAF50" : "#2196F3",
              fillOpacity: 0.2,
              weight: 2,
            }}
          />
        ))}
        
        <Marker position={[lat, lng]} />
        <MapEvents 
          setLat={setLat} 
          setLng={setLng} 
          onLocationChange={handleLocationChange}
        />
      </MapContainer>

      <div>
        <h4 style={{ fontWeight: 700 }}>Ubicacion</h4>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", opacity: 0.7 }}>Latitud</label>
            <input
              value={lat.toFixed(6)}
              readOnly
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid var(--theme-border)",
                background: "var(--theme-secondary-bg)",
                color: "var(--theme-text)",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", opacity: 0.7 }}>Longitud</label>
            <input
              value={lng.toFixed(6)}
              readOnly
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid var(--theme-border)",
                background: "var(--theme-secondary-bg)",
                color: "var(--theme-text)",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ fontWeight: 700 }}>Tipo de lugar</h4>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LocationType)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid var(--theme-border)",
            background: "var(--theme-bg)",
            color: "var(--theme-text)",
          }}
        >
          <option value="AULA">Aula</option>
          <option value="LABORATORIO">Laboratorio</option>
          <option value="OFICINA">Oficina</option>
          <option value="AUDITORIO">Auditorio</option>
          <option value="BIBLIOTECA">Biblioteca</option>
          <option value="CENTRO DE ESTUDIANTES">Centro de estudiantes</option>
          <option value="CAFETERIA">Cafeteria</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      <div>
        <h4 style={{ fontWeight: 700 }}>Detalles de la ubicacion</h4>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej: Aula 962 - Facultad de Tecnología"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid var(--theme-border)",
            background: "var(--theme-bg)",
            color: "var(--theme-text)",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          background: "var(--color-primary)",
          color: "white",
          padding: "12px",
          borderRadius: "9999px",
          fontWeight: 700,
          marginTop: "6px",
          cursor: "pointer",
        }}
      >
        Guardar
      </button>
    </div>
  );
}
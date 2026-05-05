import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from "react-leaflet";
import { useLocation } from "../hooks/useLocation";
import { saveLocation } from "../services/locationService";
import type { LocationType } from "../types";
import { isLocationValid, getCurrentZone, ALLOWED_ZONES } from "../utils/zoneLimits";
import "leaflet/dist/leaflet.css";

type MapEventsProps = {
  setLat: React.Dispatch<React.SetStateAction<number>>;
  setLng: React.Dispatch<React.SetStateAction<number>>;
};

function MapEvents({ setLat, setLng }: MapEventsProps) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
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

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  // Calcular el centro del mapa basado en el primer punto de la primera zona
  const mapCenter: [number, number] = ALLOWED_ZONES.length > 0 && ALLOWED_ZONES[0].points.length > 0
    ? ALLOWED_ZONES[0].points[0]
    : [lat, lng];

  // Función para validar y actualizar ubicación
  const handleLocationChange = (newLat: number, newLng: number) => {
    if (isLocationValid(newLat, newLng)) {
      setLat(newLat);
      setLng(newLng);
      setErrorMessage("");
      setShowError(false);
    } else {
      setErrorMessage(
        `Ubicación fuera de zonas permitidas.\n\nLas zonas permitidas son:\n` +
        ALLOWED_ZONES.map(z => `• ${z.name}`).join('\n') +
        `\n\nSolo puedes seleccionar ubicaciones dentro de estas áreas.`
      );
      setShowError(true);
      
      // Ocultar mensaje después de 4 segundos
      setTimeout(() => {
        setShowError(false);
      }, 2000);
    }
  };

  const handleSave = async () => {
    // Validar antes de guardar
    if (!isLocationValid(lat, lng)) {
      setErrorMessage("No se puede guardar: La ubicación está fuera de las zonas permitidas");
      setShowError(true);
      
      setTimeout(() => {
        setShowError(false);
      }, 3000);
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
      const zone = getCurrentZone(lat, lng);
      alert(`Ubicación guardada correctamente en ${zone}`);
    } catch (err) {
      setErrorMessage("Error al guardar la ubicación");
      setShowError(true);
    }
  };

  // Componente MapEvents con validación
  function MapEventsWithValidation({ setLat, setLng }: MapEventsProps) {
    useMapEvents({
      click(e) {
        handleLocationChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

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

      {/* Mostrar mensaje de error */}
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

      {/* Mostrar zonas permitidas */}
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
          {ALLOWED_ZONES.map((zone, idx) => (
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
        
        {/* Mostrar zonas en el mapa como polígonos */}
        {ALLOWED_ZONES.map((zone, idx) => (
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
        <MapEventsWithValidation setLat={setLat} setLng={setLng} />
      </MapContainer>

      <div>
        <h4 style={{ fontWeight: 700 }}>Ubicacion</h4>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
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
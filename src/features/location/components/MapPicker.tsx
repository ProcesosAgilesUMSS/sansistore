import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useLocation } from "../hooks/useLocation";
import { saveLocation } from "../services/locationService";
import type { LocationType } from "../types";
import "leaflet/dist/leaflet.css";

type MapEventsProps = {
  setLat: React.Dispatch<React.SetStateAction<number>>;
  setLng: React.Dispatch<React.SetStateAction<number>>;
};

function MapEvents({ setLat, setLng }: MapEventsProps) {
  useMapEvents({
    click(e) {
      //console.log("CLICK:", e.latlng);
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

  const center: [number, number] = [lat, lng];

  const handleSave = async () => {
    const payload = {
      userId: "TEMP_USER",
      lat,
      lng,
      label,
      type,
      isDefault: true,
    };

    //console.log("PAYLOAD FINAL:", payload);

    try {
      await saveLocation(payload);
      //console.log("GUARDADO OK");
    } catch (err) {
      console.error("ERROR:", err);
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

      <MapContainer
        center={center}
        zoom={16}
        style={{
          height: "320px",
          borderRadius: "1.25rem",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center} />
        <MapEvents setLat={setLat} setLng={setLng} />
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
        }}
      >
        Guardar
      </button>
    </div>
  );
}
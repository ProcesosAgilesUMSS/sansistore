// src/features/location/components/MapPicker.tsx

import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from "react-leaflet";
import { AlertCircle, ArrowLeft, ChevronDown } from "lucide-react";
import { useMapPicker } from "../hooks/useMapPicker";
import type { LocationType, Location } from "../types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const defaultIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

type MapEventsProps = {
    onLocationChange: (lat: number, lng: number) => void;
};

function MapEvents({ onLocationChange }: MapEventsProps) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationChange(lat, lng);
        },
    });

    return null;
}

const TYPE_OPTIONS: { value: LocationType; label: string }[] = [
    { value: "AULA", label: "Aula" },
    { value: "LABORATORIO", label: "Laboratorio" },
    { value: "OFICINA", label: "Oficina" },
    { value: "AUDITORIO", label: "Auditorio" },
    { value: "BIBLIOTECA", label: "Biblioteca" },
    { value: "CENTRO_ESTUDIANTES", label: "Centro de estudiantes" },
    { value: "CAFETERIA", label: "Cafetería" },
    { value: "OTRO", label: "Otro" },
];

interface MapPickerProps {
    onSave?: () => void;
    onCancel?: () => void;
    editingLocation?: Location | null;
}

export default function MapPicker({ onSave, onCancel, editingLocation }: MapPickerProps) {
    const {
        lat,
        lng,
        label,
        type,
        setLabel,
        setType,
        mapCenter,
        handleLocationChange,
        showError,
        errorMessage,
        allowedZones,
        handleSave,
        isSaving,
        isEditMode,
    } = useMapPicker({ editingLocation, onSuccess: onSave });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSave();
        onSave?.();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5 text-(--theme-text) shadow-sm"
        >
            <div className="flex items-center gap-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Volver a la lista"
                        className="flex size-8 items-center justify-center rounded-full bg-(--theme-secondary-bg) text-(--theme-text) transition-colors hover:bg-primary hover:text-white lg:hidden"
                    >
                        <ArrowLeft size={16} />
                    </button>
                )}
                <h2 className="text-lg font-black tracking-tight">
                    {isEditMode ? "Editar ubicación" : "Nueva ubicación"}
                </h2>
            </div>

            {showError && errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-(--theme-danger-border) bg-(--theme-danger-bg) px-3 py-2.5 text-sm text-(--theme-danger)">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span className="whitespace-pre-line">{errorMessage}</span>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-(--theme-border)">
                <MapContainer
                    center={mapCenter}
                    zoom={16}
                    style={{ height: "280px" }}
                    className="z-0"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {allowedZones.map((zone, idx) => (
                        <Polygon
                            key={idx}
                            positions={zone.points}
                            pathOptions={{
                                color: idx === 0 ? "#88b04b" : "#2196F3",
                                fillColor: idx === 0 ? "#88b04b" : "#2196F3",
                                fillOpacity: 0.15,
                                weight: 2,
                            }}
                        />
                    ))}

                    <Marker position={[lat, lng]} />
                    <MapEvents onLocationChange={handleLocationChange} />
                </MapContainer>
            </div>

            <p className="text-xs text-(--theme-text) opacity-60">
                Toca el mapa para marcar el punto exacto. Solo se permiten ubicaciones
                dentro de las zonas resaltadas
                {allowedZones.length > 0
                    ? ` (${allowedZones.map((z) => z.name).join(", ")})`
                    : ""}
                .
            </p>

            <div>
                <label
                    htmlFor="loc-type"
                    className="mb-1.5 block text-sm font-semibold"
                >
                    Tipo de lugar
                </label>
                <div className="relative">
                    <select
                        id="loc-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as LocationType)}
                        className="w-full appearance-none rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2.5 pr-9 text-sm text-(--theme-text) focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    >
                        {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--theme-text) opacity-50"
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor="loc-label"
                    className="mb-1.5 block text-sm font-semibold"
                >
                    Detalle de la ubicación
                </label>
                <input
                    id="loc-label"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ej: Aula 962 - Facultad de Tecnología"
                    maxLength={100}
                    className="w-full rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2.5 text-sm text-(--theme-text) placeholder:opacity-40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
            </div>

            <div className="flex gap-2 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="hidden flex-1 rounded-full border border-(--theme-border) py-3 text-sm font-bold text-(--theme-text) transition-colors hover:bg-(--theme-secondary-bg) lg:block"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? "Guardando..." : isEditMode ? "Actualizar" : "Guardar ubicación"}
                </button>
            </div>
        </form>
    );
}

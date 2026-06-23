// src/features/location/components/LocationSection.tsx

import { useState } from "react";
import { CheckCircle, MapPin, Plus } from "lucide-react";
import LocationCard from "./LocationCard";
import MapPicker from "./MapPicker";
import type { Location } from "../types";
import { useUserLocation } from "../hooks/useUserLocation";
import { useSetDefaultLocation } from "../hooks/useSetDefaultLocation";
import { useDeleteLocation } from "../hooks/useDeleteLocation";
import { useAuthUser } from "../../../hooks/useAuthUser";

type Mode = "idle" | "form";

export default function LocationSection() {
    const { user, authReady } = useAuthUser();
    const { locations, loading } = useUserLocation(user?.uid ?? null);
    const { handleSetDefault } = useSetDefaultLocation();
    const { handleDelete } = useDeleteLocation();

    const [mode, setMode] = useState<Mode>("idle");
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const startCreate = () => {
        setEditingLocation(null);
        setMode("form");
    };

    const startEdit = (location: Location) => {
        setEditingLocation(location);
        setMode("form");
    };

    const cancel = () => {
        setMode("idle");
        setEditingLocation(null);
    };

    const handleSaved = () => {
        const wasEdit = !!editingLocation;
        cancel();
        showToast(wasEdit ? "Ubicación actualizada" : "Ubicación guardada");
    };

    // No autenticado
    if (authReady && !user) {
        return (
            <div className="flex flex-col items-center gap-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapPin size={26} />
                </div>
                <p className="font-semibold text-(--theme-text)">
                    Inicia sesión para gestionar tus ubicaciones
                </p>
                <a
                    href="/iniciar-sesion"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-105"
                >
                    Iniciar sesión
                </a>
            </div>
        );
    }

    const isLoading = !authReady || loading;

    return (
        <div>
            {/* HEADER estilo productos: título izquierda + acción derecha */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black leading-none tracking-[-0.03em] text-(--theme-text)">
                        Mis ubicaciones
                    </h1>
                    <p className="mt-2 text-sm text-(--theme-text) opacity-60">
                        Gestiona tus puntos de entrega dentro del campus
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] sm:w-auto"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Agregar ubicación
                </button>
            </div>

            {/* MASTER-DETAIL */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* COLUMNA: LISTA */}
                <div className={mode === "form" ? "hidden lg:block" : "block"}>
                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-[68px] animate-pulse rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)"
                                />
                            ))}
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-(--theme-border) py-14 text-center">
                            <MapPin size={32} className="text-primary opacity-50" />
                            <p className="font-bold text-(--theme-text)">
                                Aún no tienes ubicaciones
                            </p>
                            <p className="px-6 text-sm text-(--theme-text) opacity-60">
                                Agrega tu primer punto de entrega dentro del campus.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {locations.map((loc) => (
                                <LocationCard
                                    key={loc.id}
                                    location={loc}
                                    isSelected={loc.isDefault}
                                    onSelect={(id) => user && handleSetDefault(user.uid, id)}
                                    onDelete={handleDelete}
                                    onSetDefault={(id) => user && handleSetDefault(user.uid, id)}
                                    onEdit={startEdit}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA: EDITOR */}
                <div className={mode === "idle" ? "hidden lg:block" : "block"}>
                    {mode === "form" ? (
                        <MapPicker
                            key={editingLocation?.id ?? "new"}
                            editingLocation={editingLocation}
                            onSave={handleSaved}
                            onCancel={cancel}
                        />
                    ) : (
                        <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-(--theme-border) p-8 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <MapPin size={26} />
                            </div>
                            <p className="mt-4 font-bold text-(--theme-text)">
                                Tus puntos de entrega
                            </p>
                            <p className="mt-1 max-w-xs text-sm text-(--theme-text) opacity-60">
                                Elige “Editar” en una ubicación o agrega una nueva para
                                ubicarla en el mapa.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-white shadow-lg">
                    <CheckCircle size={15} />
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}
        </div>
    );
}

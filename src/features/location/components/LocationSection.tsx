// src/features/location/components/LocationSection.tsx

import { useEffect, useState } from 'react';
import { MapPin, X, CheckCircle } from 'lucide-react';
import LocationsModal from './LocationsModal';
import MapPicker from './MapPicker';
import type { Location } from '../types';
import { useUserLocation } from '../hooks/useUserLocation';
import { useAuthUser } from '../../../hooks/useAuthUser';

type ModalView = 'none' | 'list' | 'map';

export default function LocationSection() {
    const { user } = useAuthUser();
    const { locations, loading } = useUserLocation(user?.uid ?? null);

    const [modalView, setModalView] = useState<ModalView>('none');
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [toast, setToast] = useState(false);
    
    // NUEVO: Estado para la ubicación que estamos editando
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    useEffect(() => {
        if (loading) return;

        if (locations.length === 0) {
            setSelectedLocation(null);
            return;
        }

        if (selectedLocation === null) {
            const def = locations.find(l => l.isDefault);
            if (def) setSelectedLocation(def);
        }
    }, [loading, locations]);

    const showToast = () => {
        setToast(true);
        setTimeout(() => setToast(false), 3000);
    };

    // NUEVO: Función para manejar la edición
    const handleEditLocation = (location: Location) => {
        setEditingLocation(location);  // Guardamos qué ubicación editar
        setModalView('map');           // Abrimos el mapa
    };

    // NUEVO: Función que se ejecuta después de guardar (crear o editar)
    const handleSaveSuccess = () => {
        setModalView('list');          // Volvemos a la lista
        setEditingLocation(null);      // Limpiamos la edición
        showToast();                   // Mostramos mensaje de éxito
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-(--theme-bg) transition-colors duration-300">
            <div className="flex items-center gap-3">

                {selectedLocation ? (
                    <div className="flex items-center gap-2.5 rounded-full border border-[#88B04B]/30 bg-[#88B04B]/5 px-4 py-2.5 transition-colors duration-300">
                        <MapPin size={14} className="shrink-0 text-[#88B04B]" />
                        <span className="font-outfit text-sm font-bold text-(--theme-text) transition-colors duration-300">
                            {selectedLocation.label}
                        </span>
                        <span className="font-mono text-[11px] text-(--theme-text)/50 transition-colors duration-300">
                            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-full border border-dashed border-[#88B04B]/25 px-4 py-2.5 transition-colors duration-300">
                        <MapPin size={14} className="shrink-0 text-[#88B04B]/40" />
                        <span className="font-outfit text-sm font-bold text-(--theme-text)/30 transition-colors duration-300">
                            Sin destino
                        </span>
                    </div>
                )}

                <button
                    onClick={() => setModalView('list')}
                    className="
                        rounded-full border-2 border-[#88B04B] px-6 py-2.5
                        font-outfit text-xs font-black uppercase tracking-widest
                        text-[#88B04B] transition-all hover:bg-[#88B04B] hover:text-white
                        active:scale-95
                    "
                >
                    Gestionar ubicaciones
                </button>
            </div>

            {/* MODAL DE LISTA DE UBICACIONES */}
            {modalView === 'list' && (
                <LocationsModal
                    locations={locations}
                    loading={loading}
                    userId={user!.uid}
                    initialSelectedId={selectedLocation?.id}
                    onClose={() => setModalView('none')}
                    onConfirm={(loc) => {
                        setSelectedLocation(loc);
                        setModalView('none');
                    }}
                    onAddNew={() => {
                        setEditingLocation(null);  // NUEVO: Limpiar edición cuando es nueva
                        setModalView('map');
                    }}
                    onEdit={handleEditLocation}  // NUEVO: Pasar función de edición
                />
            )}

            {/* MODAL DE MAPA (ahora soporta edición) */}
            {modalView === 'map' && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-(--theme-bg)/60 px-4 backdrop-blur-md"
                    onClick={() => {
                        setModalView('list');
                        setEditingLocation(null);  // Limpiar edición al cerrar
                    }}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[#88B04B]/20 bg-(--theme-card-bg) shadow-2xl transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#88B04B]/10 px-7 py-5">
                            {/* Título dinámico según si estamos editando o creando */}
                            <h2 className="font-outfit text-lg font-black tracking-tight text-(--theme-text) transition-colors duration-300">
                                {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
                            </h2>
                            <button
                                onClick={() => {
                                    setModalView('list');
                                    setEditingLocation(null);
                                }}
                                aria-label="Volver a la lista"
                                className="
                                    flex h-9 w-9 items-center justify-center rounded-full
                                    bg-(--theme-secondary-bg) text-(--theme-text)
                                    hover:bg-[#88B04B] hover:text-white transition-all duration-200
                                "
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <MapPicker 
                                onSave={handleSaveSuccess}  // Después de guardar, volvemos a la lista
                                editingLocation={editingLocation}  // NUEVO: Pasamos la ubicación a editar
                            />
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#88B04B] px-5 py-2.5 shadow-lg">
                    <CheckCircle size={15} className="text-white" />
                    <span className="font-outfit text-sm font-bold text-white">
                        {editingLocation ? "Ubicación actualizada" : "Ubicación guardada correctamente"}
                    </span>
                </div>
            )}
        </div>
    );
}
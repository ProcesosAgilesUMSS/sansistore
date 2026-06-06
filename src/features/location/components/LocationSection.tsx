// src/features/location/components/LocationSection.tsx

import { useState } from 'react';
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
    const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);
    const [toast, setToast] = useState(false);
    
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const selectedLocation = (() => {
        if (loading || locations.length === 0) return null;

        if (manualSelectedId) {
            const found = locations.find(l => l.id === manualSelectedId);
            if (found) return found;
        }

        const defaultLoc = locations.find(l => l.isDefault);
        if (defaultLoc) return defaultLoc;

        return locations[0] || null;
    })();

    const showToast = () => {
        setToast(true);
        setTimeout(() => setToast(false), 3000);
    };

    const handleEditLocation = (location: Location) => {
        setEditingLocation(location);  
        setModalView('map');           
    };

    const handleSaveSuccess = () => {
        setModalView('list');         
        setEditingLocation(null);     
        showToast();                   
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-(--theme-bg) transition-colors duration-300">
            <div className="flex items-center gap-3">

                {selectedLocation ? (
                    <div className="flex items-center gap-2.5 rounded-full border border-[#88B04B]/30 bg-[#88B04B]/5 px-4 py-2.5 transition-colors duration-300 min-w-0 max-w-xs sm:max-w-md">
                        <MapPin size={14} className="shrink-0 text-[#88B04B]" />
                        <span className="font-outfit text-sm font-bold text-(--theme-text) transition-colors duration-300 truncate">
                            {selectedLocation.label}
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

            {modalView === 'list' && (
                <LocationsModal
                    locations={locations}
                    loading={loading}
                    userId={user!.uid}
                    initialSelectedId={selectedLocation?.id}
                    onClose={() => setModalView('none')}
                    onConfirm={(loc) => {
                        setManualSelectedId(loc.id ?? null);
                        setModalView('none');
                    }}
                    onAddNew={() => {
                        setEditingLocation(null); 
                        setModalView('map');
                    }}
                    onEdit={handleEditLocation}  
                />
            )}


            {modalView === 'map' && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-(--theme-bg)/60 px-4 py-6 backdrop-blur-md"
                    onClick={() => {
                        setModalView('list');
                        setEditingLocation(null);  
                    }}
                >
                    <div
                        className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-[2.5rem] border border-[#88B04B]/20 bg-(--theme-card-bg) shadow-2xl transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#88B04B]/10 px-7 py-5">
                            {/* editando o creando */}
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
                        <div className="p-5 overflow-y-auto flex-1 text-(--theme-text)">
                            <MapPicker 
                                onSave={handleSaveSuccess}  
                                editingLocation={editingLocation}  
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
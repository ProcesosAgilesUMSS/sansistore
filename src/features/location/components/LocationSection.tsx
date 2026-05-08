import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
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

    useEffect(() => {
        if (!loading && selectedLocation === null) {
            const def = locations.find(l => l.isDefault);
            if (def) setSelectedLocation(def);
        }
    }, [loading, locations]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[--theme-bg] transition-colors duration-300">
            <div className="flex items-center gap-3">
                {selectedLocation ? (
                    <div className="flex items-center gap-2.5 rounded-full border border-[#88B04B]/30 bg-[#88B04B]/5 px-4 py-2.5 transition-colors duration-300">
                        <MapPin size={14} className="shrink-0 text-[#88B04B]" />
                        <span className="font-outfit text-sm font-bold text-[--theme-text] transition-colors duration-300">
                            {selectedLocation.label}
                        </span>
                        <span className="font-mono text-[11px] text-[--theme-text]/50 transition-colors duration-300">
                            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-full border border-dashed border-[#88B04B]/25 px-4 py-2.5 transition-colors duration-300">
                        <MapPin size={14} className="shrink-0 text-[#88B04B]/40" />
                        <span className="font-outfit text-sm font-bold text-[--theme-text]/30 transition-colors duration-300">
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
                        setSelectedLocation(loc);
                        setModalView('none');
                    }}
                    onAddNew={() => setModalView('map')}
                />
            )}

            {modalView === 'map' && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[--theme-bg]/60 px-4 backdrop-blur-md"
                    onClick={() => setModalView('list')}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[#88B04B]/20 bg-[--theme-card-bg] shadow-2xl transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#88B04B]/10 px-7 py-5">
                            <h2 className="font-outfit text-lg font-black tracking-tight text-[--theme-text] transition-colors duration-300">
                                Nueva Ubicación
                            </h2>
                            <button
                                onClick={() => setModalView('list')}
                                aria-label="Volver a la lista"
                                className="
                                    flex h-9 w-9 items-center justify-center rounded-full
                                    bg-[--theme-secondary-bg] text-[--theme-text]
                                    hover:bg-[#88B04B] hover:text-white transition-all duration-200
                                "
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <MapPicker />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

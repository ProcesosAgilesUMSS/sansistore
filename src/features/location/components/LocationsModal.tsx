import { useState } from 'react';
import { X, Plus, MapPin, Loader2 } from 'lucide-react';
import LocationCard from './LocationCard';
import ErrorModal from './ErrorModal';
import { useDeleteLocation } from '../hooks/useDeleteLocation';
import { useSetDefaultLocation } from '../hooks/useSetDefaultLocation';
import type { Location } from '../types';

interface LocationsModalProps {
    locations: Location[];
    loading: boolean;
    userId: string;
    initialSelectedId?: string;
    onClose: () => void;
    onConfirm: (location: Location) => void;
    onAddNew: () => void;
    onEdit: (location: Location) => void; 
}

export default function LocationsModal({
    locations,
    loading,
    userId,
    initialSelectedId,
    onClose,
    onConfirm,
    onAddNew,
    onEdit
}: LocationsModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);

    const { handleDelete } = useDeleteLocation();
    const { handleSetDefault, error: defaultError, clearError } = useSetDefaultLocation();

    const handleConfirm = () => {
        const selected = locations.find(l => l.id === selectedId);
        if (selected) onConfirm(selected);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-xl"

            onClick={onClose}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-[#88B04B]/20 bg-(--theme-card-bg) shadow-2xl transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#88B04B]/10 px-7 py-5">
                    <h2 className="font-outfit text-lg font-black tracking-tight text-(--theme-text) transition-colors duration-300">
                        Mis Ubicaciones
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="
                            flex h-9 w-9 items-center justify-center rounded-full
                            bg-(--theme-secondary-bg) text-(--theme-text)
                            hover:bg-[#88B04B] hover:text-white transition-all duration-200
                        "
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex max-h-[22rem] flex-col gap-3 overflow-y-auto p-5 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-(--theme-text)/40">
                            <Loader2 size={28} className="animate-spin text-[#88B04B]/60" />
                            <p className="font-outfit text-sm font-bold">Cargando ubicaciones...</p>
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-(--theme-text)/40">
                            <MapPin size={32} className="text-[#88B04B]/40" />
                            <p className="font-outfit text-sm font-bold">No hay destinos guardados</p>
                        </div>
                    ) : (
                        locations.map((loc) => (
                            <LocationCard
                                key={loc.id}
                                location={loc}
                                isSelected={selectedId === loc.id}
                                onSelect={setSelectedId}
                                onDelete={handleDelete}
                                onSetDefault={(id) => handleSetDefault(userId, id)}
                                onEdit={onEdit}
                            />
                        ))
                    )}
                </div>

                <div className="flex flex-col gap-2 px-6 pb-7 pt-2">
                    <button
                        onClick={onAddNew}
                        className="
                            flex w-full items-center justify-center gap-2 rounded-full
                            border-2 border-[#88B04B]/40 py-3
                            font-outfit text-[11px] font-black uppercase tracking-[0.15em] text-[#88B04B]
                            transition-all hover:border-[#88B04B] hover:bg-[#88B04B]/5 active:scale-95
                        "
                    >
                        <Plus size={16} strokeWidth={3} />
                        Agregar nueva ubicación
                    </button>

                    <button
                        disabled={!selectedId}
                        onClick={handleConfirm}
                        className="
                            flex w-full items-center justify-center rounded-full py-3
                            font-outfit text-[11px] font-black uppercase tracking-[0.15em] text-white
                            bg-[#88B04B] transition-all active:scale-95
                            disabled:opacity-40 disabled:cursor-not-allowed
                        "
                    >
                        Confirmar ubicación
                    </button>
                </div>
            </div>

            <ErrorModal
                isOpen={!!defaultError}
                title="Error de Preferencia"
                message={defaultError ?? ''}
                onClose={clearError}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(136, 176, 75, 0.2); 
                    border-radius: 10px; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(136, 176, 75, 0.4);
                }
            `}} />
        </div>
    );
}

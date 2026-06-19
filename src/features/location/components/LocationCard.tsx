// src/features/location/components/LocationCard.tsx

import { useState } from 'react';
import { Trash2, Star, Pencil } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import ErrorModal from './ErrorModal';
import type { Location } from '../types';
import { TYPE_ICONS } from '../constants/locationIcons';
import { hasActiveOrders } from '../services/locationService';

interface LocationCardProps {
    location: Location;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => Promise<void>;
    onSetDefault: (id: string) => void;
    onEdit: (location: Location) => void;
}

export default function LocationCard({
    location,
    isSelected,
    onSelect,
    onDelete,
    onSetDefault,
    onEdit
}: LocationCardProps) {
    const { id, label, type, lat, lng, isDefault } = location;
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!id) return null;

    const handleConfirmDelete = async () => {
        setShowConfirmModal(false);
        setIsDeleting(true);
        setErrorMessage('');
        setShowErrorModal(false);
        
        try {
            await onDelete(id);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al eliminar la ubicación';
            setErrorMessage(message);
            setShowErrorModal(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            const hasActive = await hasActiveOrders(id);
            
            if (hasActive) {
                setErrorMessage('No se puede editar esta ubicación porque tiene pedidos pendientes o en camino');
                setShowErrorModal(true);
                return;
            }
            onEdit(location);
        } catch (error) {
            setErrorMessage('Error al verificar la ubicación');
            setShowErrorModal(true);
        }
    };

    const handleSetDefaultClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSetDefault(id);
    };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            const hasActive = await hasActiveOrders(id);
            
            if (hasActive) {
                setErrorMessage('No se puede eliminar esta ubicación porque tiene pedidos pendientes o en camino');
                setShowErrorModal(true);
                return;
            }
            setShowConfirmModal(true);
        } catch (error) {
            setErrorMessage('Error al verificar la ubicación');
            setShowErrorModal(true);
        }
    };

    return (
        <>
            <div
                onClick={() => onSelect(id)}
                className={`
                    group flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 
                    transition-all duration-300 cursor-pointer
                    ${isSelected
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border-(--theme-border) bg-(--theme-card-bg) hover:border-primary'
                    }
                    ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-(--theme-secondary-bg) text-(--theme-text) transition-colors duration-300">
                    {TYPE_ICONS[type]}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold leading-none text-(--theme-text) transition-colors duration-300  truncate block w-full">
                            {label}
                        </span>
                    </div>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary truncate block w-full">
                        {type}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSetDefaultClick}
                        aria-label={`Establecer ${label} como predeterminada`}
                        className={`
                            flex h-8 w-8 items-center justify-center rounded-full transition-all
                            ${isDefault
                                ? 'text-primary opacity-100'
                                : 'text-(--theme-text) opacity-40 hover:opacity-100 hover:text-primary'
                            }
                        `}
                    >
                        <Star size={16} fill={isDefault ? 'currentColor' : 'none'} />
                    </button>

                    <button
                        onClick={handleEditClick}
                        aria-label={`Editar ${label}`}
                        className="
                            flex h-8 w-8 items-center justify-center rounded-full
                            text-(--theme-text) opacity-40 transition-all
                            hover:opacity-100 hover:text-primary
                        "
                    >
                        <Pencil size={16} />
                    </button>

                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        aria-label={`Eliminar ${label}`}
                        className="
                            flex h-8 w-8 items-center justify-center rounded-full
                            text-(--theme-danger) opacity-40 transition-all
                            hover:opacity-100 hover:bg-(--theme-danger-bg)
                            disabled:opacity-20 disabled:cursor-not-allowed
                        "
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                title="Eliminar ubicación"
                message={`¿Estás seguro que deseas eliminar "${type}"?`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowConfirmModal(false)}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <ErrorModal
                isOpen={showErrorModal}
                title="No se puede eliminar/editar"
                message={errorMessage}
                onClose={() => setShowErrorModal(false)}
            />
        </>
    );
}

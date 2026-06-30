// src/features/location/components/LocationCard.tsx

import { useEffect, useRef, useState } from 'react';
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

const TYPE_LABELS: Record<Location['type'], string> = {
    AULA: 'Aula',
    OFICINA: 'Oficina',
    LABORATORIO: 'Laboratorio',
    AUDITORIO: 'Auditorio',
    BIBLIOTECA: 'Biblioteca',
    CENTRO_ESTUDIANTES: 'Centro de estudiantes',
    CAFETERIA: 'Cafeteria',
    OTRO: 'Otro',
};

export default function LocationCard({
    location,
    isSelected,
    onSelect,
    onDelete,
    onSetDefault,
    onEdit
}: LocationCardProps) {
    const { id, label, type, isDefault } = location;
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [defaultAnimation, setDefaultAnimation] = useState<'idle' | 'adding' | 'removing'>('idle');
    const previousDefaultRef = useRef(isDefault);
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (previousDefaultRef.current === isDefault) return;

        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

        const nextAnimation = isDefault ? 'adding' : 'removing';
        setDefaultAnimation(nextAnimation);
        animationTimeoutRef.current = setTimeout(
            () => setDefaultAnimation('idle'),
            nextAnimation === 'adding' ? 520 : 640
        );
        previousDefaultRef.current = isDefault;
    }, [isDefault]);

    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        };
    }, []);

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
        } catch {
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
        } catch {
            setErrorMessage('Error al verificar la ubicación');
            setShowErrorModal(true);
        }
    };

    return (
        <>
            <div
                onClick={() => onSelect(id)}
                className={`
                    group flex items-center gap-3 rounded-[1.35rem] border px-4 py-3.5
                    cursor-pointer transition-all duration-300
                    ${isSelected
                      ? 'border-primary bg-primary/6 shadow-lg shadow-primary/10'
                      : 'border-(--theme-border) bg-(--theme-card-bg) hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-black/5'
                     }
                    ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                    isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-(--theme-secondary-bg) text-(--theme-text) group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                    {TYPE_ICONS[type]}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <span className="block w-full truncate text-sm font-extrabold leading-none text-(--theme-text) transition-colors duration-300">
                            {label}
                        </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.16em] text-primary/85">
                        {TYPE_LABELS[type]}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-transparent bg-transparent p-0.5 transition-colors duration-300 group-hover:border-(--theme-border) group-hover:bg-(--theme-secondary-bg)/70">
                    <button
                        onClick={handleSetDefaultClick}
                        aria-label={isDefault ? `Quitar ${label} como predeterminada` : `Establecer ${label} como predeterminada`}
                        className={`
                            flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200
                            ${isDefault
                                ? 'bg-primary/10 text-primary opacity-100'
                                : 'text-(--theme-text) opacity-40 hover:bg-primary/8 hover:text-primary hover:opacity-100'
                            }
                        `}
                    >
                        <span className="relative flex h-4 w-4 items-center justify-center">
                            {defaultAnimation === 'adding' && (
                                <span aria-hidden="true" className="location-star-burst absolute inset-0 rounded-full" />
                            )}
                            <Star
                                size={16}
                                fill={isDefault ? 'currentColor' : 'none'}
                                className={defaultAnimation === 'adding' ? 'location-star-pop' : ''}
                            />
                            {defaultAnimation === 'removing' && (
                                <span aria-hidden="true" className="location-star-fade absolute inset-0">
                                    <Star size={16} fill="currentColor" className="location-star-fall" />
                                </span>
                            )}
                        </span>
                    </button>

                    <button
                        onClick={handleEditClick}
                        aria-label={`Editar ${label}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-(--theme-text) opacity-40 transition-all duration-200 hover:bg-primary/8 hover:text-primary hover:opacity-100"
                    >
                        <Pencil size={16} />
                    </button>

                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        aria-label={`Eliminar ${label}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-(--theme-danger) opacity-40 transition-all duration-200 hover:bg-(--theme-danger-bg) hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-20"
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

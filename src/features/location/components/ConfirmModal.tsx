// src/features/location/components/ConfirmModal.tsx

import { X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Eliminar",
    cancelText = "Cancelar"
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-(--theme-card-bg) border border-(--theme-border) shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-(--theme-border) px-5 py-4">
                    <h3 className="font-bold text-(--theme-text) text-lg">
                        {title}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-(--theme-text)/50 hover:text-(--theme-text) transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <p className="text-(--theme-text)/80">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3 px-5 pb-5 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-full border border-(--theme-border) py-2.5 text-xs font-bold uppercase tracking-wider text-(--theme-text) transition-all hover:bg-(--theme-secondary-bg)"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-full bg-(--theme-danger) text-white hover:opacity-90 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

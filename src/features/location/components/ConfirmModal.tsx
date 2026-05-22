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
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-(--theme-card-bg) border border-[#88B04B]/20 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#88B04B]/10 px-5 py-4">
                    <h3 className="font-outfit font-bold text-(--theme-text) text-lg">
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
                    <p className="font-inter text-(--theme-text)/80">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3 px-5 pb-5 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-full border border-[#88B04B]/40 py-2.5 font-outfit text-xs font-bold uppercase tracking-wider text-[#88B04B] transition-all hover:bg-[#88B04B]/5"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-full bg-red-500 py-2.5 font-outfit text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-600"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
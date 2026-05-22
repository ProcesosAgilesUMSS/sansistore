// src/features/location/components/ErrorModal.tsx

import { X, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export default function ErrorModal({
    isOpen,
    title,
    message,
    onClose
}: ErrorModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-(--theme-card-bg) border border-red-500/30 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-red-500/20 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-500" />
                        <h3 className="font-outfit font-bold text-(--theme-text) text-lg">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-(--theme-secondary-bg) text-(--theme-text) hover:bg-red-500 hover:text-white transition-all duration-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body  */}
                <div className="px-5 py-4">
                    <p className="font-inter text-(--theme-text)/80">
                        {message}
                    </p>
                </div>

                {/* Footer  */}
                <div className="flex gap-3 px-5 pb-5 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full bg-red-500 py-2.5 font-outfit text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-600"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
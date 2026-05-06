import type { Order } from '../types';
import { formatCurrency } from '../../utils/currency';

interface Props {
    order: Order;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const ConfirmModal = ({ order, onConfirm, onCancel, isLoading }: Props) => {

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            <div className="relative z-10 w-full max-w-sm rounded-[1.25rem] bg-[var(--theme-card-bg)] border border-[var(--theme-border)] p-6 shadow-2xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--theme-secondary-bg)' }}>
                    <svg
                        className="h-6 w-6"
                        style={{ color: 'var(--color-primary)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h2
                    id="confirm-title"
                    className="mb-1 font-800 text-lg text-[var(--theme-text)]"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                    ¿Marcar como listo?
                </h2>

                <p className="mb-1 text-sm text-[var(--theme-text)] opacity-60">
                    Pedido <span className="font-600 opacity-100">#{order.orderId.slice(-6).toUpperCase()}</span>
                </p>
                <p className="mb-5 text-sm text-[var(--theme-text)] opacity-60">
                    Total:{' '}
                    <span className="font-700" style={{ color: 'var(--color-primary)' }}>{formatCurrency(order.total)}</span>
                </p>

                <p className="mb-6 text-sm text-[var(--theme-text)] opacity-70 leading-relaxed">
                    El pedido pasará a estado <strong>LISTO</strong> y estará disponible para ser
                    asignado a un mensajero. Esta acción no se puede deshacer.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 rounded-full border border-[var(--theme-border)] px-4 py-2.5 text-sm font-600 text-[var(--theme-text)] transition hover:bg-[var(--theme-secondary-bg)] disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 rounded-full bg-[#88B04B] px-4 py-2.5 text-sm font-700 text-white transition hover:bg-[#7a9e43] active:scale-95 disabled:opacity-60"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    />
                                </svg>
                                Procesando…
                            </span>
                        ) : (
                            'Confirmar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

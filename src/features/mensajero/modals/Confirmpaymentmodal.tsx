import { useState } from 'react';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import type { MessengerOrder } from '../types';
import { parseOrderId } from '../../cart/services/orderService';

interface ConfirmPaymentModalProps {
    order: MessengerOrder;
    onClose: () => void;
    onConfirm: (order: MessengerOrder, secret: string) => Promise<void>;
}

const formatBolivianos = (amount: number) => `Bs ${amount}`;

export default function ConfirmPaymentModal({
    order,
    onClose,
    onConfirm,
}: ConfirmPaymentModalProps) {
    const [secret, setSecret] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = secret.trim().length > 0 && !saving && !success;

    const handleConfirm = async () => {
        if (!canSubmit) return;
        setError('');
        setSaving(true);
        try {
            await onConfirm(order, secret.trim());
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError('Código incorrecto o no se pudo registrar el pago.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
        >
            <section className="w-full max-w-md rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">

                {/* Header */}
                <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">
                            Registrar pago
                        </h2>
                        <p className="mt-0.5 text-sm font-semibold opacity-60">
                            Ingresa el código del comprador para confirmar.
                        </p>
                    </div>
                    <button
                        aria-label="Cerrar"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
                        onClick={onClose}
                        type="button"
                        disabled={saving}
                    >
                        <X size={16} />
                    </button>
                </header>

                <div className="space-y-5 p-6">

                    {/* Resumen del pedido */}
                    <article className="messenger-cash-box rounded-[20px] border-2 p-5 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="messenger-muted text-xs font-bold uppercase">
                                Orden
                            </span>
                                <span className="text-sm font-black">
                                    {parseOrderId(order.id).friendlyName}
                                </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="messenger-muted text-xs font-bold uppercase">
                                Cliente
                            </span>
                            <span className="text-sm font-black">{order.customerName}</span>
                        </div>
                        <div className="border-t border-border-light pt-3 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase">Total a cobrar</span>
                            <span className="text-2xl font-black text-primary">
                                {formatBolivianos(order.cashToCollect)}
                            </span>
                        </div>
                    </article>

                    {/* Éxito */}
                    {success ? (
                        <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-green-400 bg-green-50 px-5 py-6 text-center">
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 size={28} className="text-green-600" />
                            </span>
                            <p className="text-base font-black text-green-700">
                                Orden entregada exitosamente
                            </p>
                            <button
                                className="mt-1 rounded-2xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 active:scale-95"
                                onClick={onClose}
                                type="button"
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Input de código secret */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="secret-input"
                                    className="flex items-center gap-2 text-xs font-bold uppercase messenger-muted"
                                >
                                    <KeyRound size={13} />
                                    Código de confirmación del comprador
                                </label>
                                <input
                                    id="secret-input"
                                    type="text"
                                    value={secret}
                                    onChange={(e) => {
                                        setSecret(e.target.value);
                                        setError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') void handleConfirm();
                                    }}
                                    placeholder="Ingresa el código secret"
                                    className="w-full rounded-2xl border-2 border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-bold text-text-light outline-none transition placeholder:font-normal placeholder:opacity-50 focus:border-primary"
                                    autoComplete="off"
                                    disabled={saving}
                                />
                                {error && (
                                    <p className="text-xs font-bold text-red-500">{error}</p>
                                )}
                            </div>

                            {/* Botón de confirmar */}
                            <button
                                className="messenger-deliver-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => void handleConfirm()}
                                type="button"
                                disabled={!canSubmit}
                            >
                                <CheckCircle2 size={17} />
                                {saving ? 'Registrando...' : 'Registrar pago'}
                            </button>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
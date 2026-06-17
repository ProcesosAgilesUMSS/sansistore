import { useMemo, useState } from 'react';
import { DollarSign, LoaderCircle, X, XCircle } from 'lucide-react';
import type { MessengerOrder } from '../types';
import { formatBolivianos } from '../utils/money';

interface CancelNoPaymentModalProps {
  order: MessengerOrder;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

export default function CancelNoPaymentModal({
  order,
  isSaving,
  onClose,
  onConfirm,
}: CancelNoPaymentModalProps) {
  const [notes, setNotes] = useState('');

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date()),
    []
  );

  const confirmCancellation = async () => {
    if (isSaving) return;
    await onConfirm(notes.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--theme-error-bg) text-(--theme-error)">
              <DollarSign size={24} />
            </span>

            <div>
              <h2 className="text-xl font-black tracking-normal">
                Cancelar pedido
              </h2>
              <p className="text-sm font-medium opacity-70">
                Registra la cancelación por falta de pago.
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Cliente</p>
              <p className="mt-1 text-sm font-bold">{order.customerName}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase opacity-50">Monto</p>
              <p className="mt-1 text-sm font-bold">{formatBolivianos(order.cashToCollect)}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase opacity-50">Fecha</p>
              <p className="mt-1 text-sm font-bold">{currentDate}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) p-4 text-sm font-semibold text-(--theme-error)">
            El pedido será marcado como CANCELADO porque el cliente no realizó
            el pago contra entrega.
          </div>

          <label className="block text-sm font-bold">
            Observaciones adicionales
            <textarea
              className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-medium outline-none focus:border-(--theme-error-border)"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: El cliente indicó que no realizará el pago..."
              value={notes}
            />
          </label>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-6 py-5 sm:flex-row">
          <button
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
            onClick={onClose}
            type="button"
          >
            Volver
          </button>

          <button
            className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-(--theme-error) px-5 text-sm font-black uppercase text-(--theme-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={confirmCancellation}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <XCircle size={16} />
            )}
            Confirmar cancelación
          </button>
        </footer>
      </section>
    </div>
  );
}

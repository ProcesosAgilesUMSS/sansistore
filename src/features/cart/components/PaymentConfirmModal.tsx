import { AlertCircle, CreditCard, Loader2, X } from 'lucide-react';
import type { Location } from '../../location/types';

interface Props {
  location: Location;
  total: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function PaymentConfirmModal({
  location,
  total,
  onClose,
  onConfirm,
  loading,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard size={18} />
          </div>
          <h2 id="payment-title" className="text-lg font-bold text-text-light">
            Pago contra entrega
          </h2>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="w-full rounded-xl border border-primary bg-primary/5 p-3 text-left">
            <p className="text-sm font-semibold text-text-light">
              {location.label}
            </p>
            <p className="mt-1 text-xs text-text-light opacity-60 capitalize">
              {location.type}
              {location.isDefault && ' (Predeterminada)'}
            </p>
          </div>

          <div className="w-full rounded-xl border border-border-light p-3 text-left">
            <p className="text-xs text-text-light opacity-60">Total a pagar</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              Bs {total.toFixed(2)}
            </p>
          </div>

          <div className="w-full rounded-xl border border-primary bg-primary/5 p-3 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 text-primary" size={20} />

              <div>
                <p className="text-sm font-semibold text-primary">Importante</p>

                <p className="text-sm text-text-light opacity-80">
                  Su pago se realizará contra entrega.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Confirmar'
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

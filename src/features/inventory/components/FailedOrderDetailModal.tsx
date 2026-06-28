import {
  AlertTriangle,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import type { FailedOrder } from '../services/failedOrdersService';

interface FailedOrderDetailModalProps {
  order: FailedOrder;
  error: string | null;
  isRestoring: boolean;
  onClose: () => void;
  onRestoreStock: (order: FailedOrder) => void;
}

const currency = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

export function FailedOrderDetailModal({
  order,
  error,
  isRestoring,
  onClose,
  onRestoreStock,
}: FailedOrderDetailModalProps) {
  const canRestore = !order.stockRestored && order.items.length > 0;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) text-(--theme-text) shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-(--theme-border) px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {order.type}
            </p>
            <h2 className="mt-1 text-lg font-black">Pedido fallido</h2>
            <p className="mt-1 text-xs opacity-60">#{order.id.slice(0, 12)}</p>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) transition hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 p-4">
            <div>
              <p className="text-xs font-bold uppercase opacity-50">
                Cliente
              </p>
              <p className="mt-1 text-sm font-bold">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">
                Zona
              </p>
              <p className="mt-1 text-sm font-bold">{order.zone}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">
                Monto
              </p>
              <p className="mt-1 text-sm font-bold text-primary">
                {currency.format(order.total)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">
                Fecha
              </p>
              <p className="mt-1 text-sm font-bold">
                {order.failedAt
                  ? order.failedAt.toLocaleString('es-BO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sin fecha'}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] opacity-55">
              Motivo del fallo
            </p>
            <p className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/40 px-4 py-3 text-sm font-medium">
              {order.reason ?? 'Sin motivo registrado.'}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] opacity-55">
              Productos ({order.items.length})
            </p>
            <ul className="divide-y divide-(--theme-border) overflow-hidden rounded-2xl border border-(--theme-border)">
              {order.items.length === 0 ? (
                <li className="px-4 py-3 text-sm opacity-50">
                  Sin productos registrados.
                </li>
              ) : (
                order.items.map((item, idx) => (
                  <li
                    key={`${item.productId}-${idx}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 font-semibold">
                      {item.productName}
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                      x{item.quantity}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {order.stockRestored && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
              <PackageCheck size={16} />
              El stock de este pedido ya fue repuesto.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-3 text-sm font-semibold text-(--theme-error)">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2.5 border-t border-(--theme-border) bg-(--theme-secondary-bg)/40 px-4 py-4 sm:flex-row sm:px-6 sm:py-5">
          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-card-bg) text-sm font-black uppercase tracking-wide sm:flex-1"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-black uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:flex-[1.2]"
            disabled={!canRestore || isRestoring}
            onClick={() => onRestoreStock(order)}
            type="button"
          >
            {isRestoring ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <RotateCcw size={16} />
            )}
            Reponer stock
          </button>
        </footer>
      </section>
    </div>
  );
}

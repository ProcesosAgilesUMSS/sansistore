import { useState } from 'react';
import { AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import { useFailedOrders } from '../hooks/useFailedOrders';
import type { FailedOrder } from '../services/failedOrdersService';
import { FailedOrderDetailModal } from './FailedOrderDetailModal';

const currency = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

function TypeBadge({ type }: { type: FailedOrder['type'] }) {
  const isCancelled = type === 'CANCELADO';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
        isCancelled
          ? 'bg-(--theme-error-bg) text-(--theme-error)'
          : 'bg-(--theme-warning-bg) text-(--theme-warning)'
      }`}
    >
      {isCancelled ? <PackageX size={12} /> : <AlertTriangle size={12} />}
      {type}
    </span>
  );
}

export function FailedOrdersPanel() {
  const {
    orders,
    loading,
    error,
    restoreError,
    restoringId,
    restoreStock,
    clearRestoreError,
  } =
    useFailedOrders();
  const [selected, setSelected] = useState<FailedOrder | null>(null);

  // Mantiene el modal sincronizado con la lista en tiempo real (ej. tras reponer).
  const selectedLive = selected
    ? (orders.find((order) => order.id === selected.id) ?? selected)
    : null;

  const handleRestore = async (order: FailedOrder) => {
    await restoreStock(order);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-(--theme-text)">
            Pedidos con <span className="text-primary">fallos</span>
          </h2>
          <p className="text-xs opacity-60 text-(--theme-text)">
            Pedidos no entregados o cancelados. Revisa el motivo y repón su
            stock al inventario.
          </p>
        </div>
        <span className="rounded-full border border-(--theme-border) px-4 py-2 text-sm font-bold text-(--theme-text)">
          {loading ? '...' : `${orders.length} pedidos`}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-3 text-sm font-semibold text-(--theme-error)">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl bg-(--theme-secondary-bg)"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-(--theme-border) px-6 py-16 text-center">
          <PackageCheck className="opacity-40 text-(--theme-text)" size={28} />
          <p className="text-sm opacity-50 text-(--theme-text)">
            No hay pedidos con fallos. ¡Todo en orden!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => {
                clearRestoreError();
                setSelected(order);
              }}
              className="flex flex-col gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5 text-left transition hover:border-primary/50 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TypeBadge type={order.type} />
                  {order.stockRestored && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-primary">
                      <PackageCheck size={11} />
                      Stock repuesto
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-black text-(--theme-text)">
                  {order.customerName}
                </p>
                <p className="mt-0.5 truncate text-xs opacity-60 text-(--theme-text)">
                  {order.zone} · {order.reason ?? 'Sin motivo'}
                </p>
              </div>

              <div className="flex items-center gap-5 md:flex-col md:items-end md:gap-1">
                <p className="text-base font-black text-primary">
                  {currency.format(order.total)}
                </p>
                <p className="text-xs opacity-55 text-(--theme-text)">
                  {order.failedAt
                    ? order.failedAt.toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Sin fecha'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLive && (
        <FailedOrderDetailModal
          order={selectedLive}
          error={restoringId === selectedLive.id || restoreError ? restoreError : null}
          isRestoring={restoringId === selectedLive.id}
          onClose={() => {
            clearRestoreError();
            setSelected(null);
          }}
          onRestoreStock={handleRestore}
        />
      )}
    </div>
  );
}

import type { Order } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';
import { StatusPill } from './StatusPill';
import { parseOrderId } from '@/features/cart/services/orderService';

interface Props {
  order: Order;
  onViewDetails: (order: Order) => void;
  onPrimaryAction: (order: Order) => void;
  primaryActionLabel: string;
  isPrimaryActionLoading: boolean;
  isPrimaryActionSuccess?: boolean;
  successLabel?: string;
  primaryActionLoadingLabel?: string;
}

export const CardOrder = ({
  order,
  onViewDetails,
  onPrimaryAction,
  primaryActionLabel,
  isPrimaryActionLoading,
  isPrimaryActionSuccess = false,
  successLabel = 'Pedido marcado como listo',
  primaryActionLoadingLabel = 'Procesando…',
}: Props) => {
  const items = order.items ?? [];
  const visibleItems = items.slice(0, 3);
  const hiddenItems = Math.max(items.length - visibleItems.length, 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-(--theme-border) bg-linear-to-br from-(--theme-card-bg) to-(--theme-secondary-bg)/40 shadow-sm duration-200 hover:shadow-xl">
      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="mt-1 text-lg font-bold tracking-tight text-(--theme-text)">
                  {parseOrderId(order.orderId).friendlyName}
                </h3>
                <p className="mt-2 text-sm font-700 text-(--theme-text) opacity-80">
                  {order.buyerName ?? 'Comprador desconocido'}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  {order.buyerEmail ?? order.buyerInstitutionalId ?? 'Sin datos del comprador'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
                  Total
                </p>
                <p className="font-900 text-2xl tracking-tight text-primary">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={order.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Ubicación
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {order.locationLabel ?? 'No registrada'}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  {order.locationType ?? 'Tipo no registrado'}
                </p>
              </div>

              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Fecha
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  Actualizado {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Productos
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {items.length} producto{items.length === 1 ? '' : 's'}
                </p>
              </div>

              <span className="rounded-full border border-(--theme-border) bg-(--theme-card-bg) px-3 py-1 text-xs font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-70">
                Pedido
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {visibleItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-4 text-sm text-(--theme-text) opacity-60">
                  No se encontraron productos para este pedido.
                </div>
              ) : (
                visibleItems.map((item) => (
                  <div key={item.itemId} className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-800 text-(--theme-text)">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-sm font-800 text-primary">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {hiddenItems > 0 && (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-3 text-sm font-700 text-(--theme-text) opacity-65">
                  +{hiddenItems} producto{hiddenItems === 1 ? '' : 's'} más
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="inline-flex items-center justify-center rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary"
          >
            Ver detalles
          </button>

          <button
            type="button"
            onClick={() => onPrimaryAction(order)}
            disabled={isPrimaryActionLoading}
            className="inline-flex items-center justify-center cursor-pointer rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPrimaryActionLoading ? primaryActionLoadingLabel : primaryActionLabel}
          </button>
        </div>

        {isPrimaryActionSuccess && (
          <p className="mt-4 text-sm font-700 text-primary">
            {successLabel}
          </p>
        )}
      </div>
    </article>
  );
};

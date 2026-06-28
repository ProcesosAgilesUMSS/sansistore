import type { Order, OrderItem } from '../types';
import { SkeletonRow } from './SkeletonRow';
import { StatusPill } from './StatusPill';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';

interface Props {
  order: Order;
  isExpanded: boolean;
  expandedItems: OrderItem[];
  itemsLoading: boolean;
  onToggle: (id: string) => void;
  title?: string;
  onClick?: (order: Order) => void;
  isMarking: boolean;
  isSuccess: boolean;
  successLabel?: string;
}

export const OrderCard = ({
  order,
  isExpanded,
  expandedItems,
  itemsLoading,
  onToggle,
  title = '',
  onClick,
  isMarking,
  isSuccess,
  successLabel = 'Marcado como listo',
}: Props) => {
  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] border bg-(--theme-card-bg) transition-all duration-200 hover:-translate-y-px hover:shadow-lg ${isSuccess
        ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(136,176,75,0.25)]'
        : 'border-(--theme-border)'
        }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-800 text-xs tracking-tight text-(--theme-text) pb-2"
            >
              # {order.orderId?.toUpperCase()}
            </p>
            <p className="font-800 text-lg tracking-tight text-(--theme-text)"
            >
              {order.buyerName?.toUpperCase()}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-(--theme-text) opacity-50">
                {formatDate(order.confirmedAt ?? order.createdAt)}
              </p>

              <StatusPill status={order.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-(--theme-text) opacity-50">
              <span>
                {expandedItems.length > 0
                  ? `${expandedItems.length} productos`
                  : 'Pedido'}
              </span>

              {order.locationLabel && (
                <>
                  <span>•</span>
                  <span>{order.locationLabel}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
              Total
            </p>

            <p className="font-800 text-lg tracking-tight text-primary">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggle(order.orderId)}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-(--theme-border) px-4 py-3 text-sm font-600 text-(--theme-text) transition hover:bg-(--theme-secondary-bg)"
          aria-expanded={isExpanded}
        >
          <span>
            {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
          </span>

          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-(--theme-border) pb-4">
          <div className="space-y-3 px-4 pt-4">
            {itemsLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : expandedItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-(--theme-text) opacity-40">
                Sin productos
              </div>
            ) : (
              expandedItems.map((item) => (
                <div
                  key={item.itemId}
                  className="rounded-xl border border-(--theme-border) p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-700 text-sm text-(--theme-text)">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-xs text-(--theme-text) opacity-50">
                        {item.quantity} ×{' '}
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <p className="whitespace-nowrap font-700 text-sm text-primary">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {onClick && (
        <div className="flex justify-end border-t border-(--theme-border) px-4 py-4">
          {isSuccess ? (
            <span className="flex items-center gap-1.5 text-sm font-600 text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>

              {successLabel}
            </span>
          ) : (
            <button
              onClick={() => onClick(order)}
              disabled={isMarking}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-700 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {isMarking ? 'Procesando…' : title}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

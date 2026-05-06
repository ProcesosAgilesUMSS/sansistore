import type { Order, OrderItem } from '../types';
import { ItemRow } from './ItemRow';
import { SkeletonRow } from './SkeletonRow';
import { StatusPill } from './StatusPill';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/formatDate';

interface Props {
    order: Order;
    isExpanded: boolean;
    expandedItems: OrderItem[];
    itemsLoading: boolean;
    onToggle: (id: string) => void;
    onMarkReady?: (order: Order) => void;
    isMarking: boolean;
    isSuccess: boolean;
}

export const OrderCard = ({
    order,
    isExpanded,
    expandedItems,
    itemsLoading,
    onToggle,
    onMarkReady,
    isMarking,
    isSuccess,
}: Props) => {
    return (
        <div
            className={`rounded-[1.25rem] border bg-[var(--theme-card-bg)] transition-all duration-200 ${isSuccess
                ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(136,176,75,0.25)]'
                : 'border-[var(--theme-border)]'
                }`}
        >
            <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                    <p
                        className="font-800 text-base text-[var(--theme-text)] tracking-tight"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                        #{order.orderId.slice(-6).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--theme-text)] opacity-50">
                        {formatDate(order.confirmedAt ?? order.createdAt)}
                    </p>
                </div>

                <StatusPill status={order.status} />

                <p className="font-700 text-[var(--color-primary)] text-base">
                    {formatCurrency(order.total)}
                </p>

                <button
                    onClick={() => onToggle(order.orderId)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text)] opacity-60 transition hover:opacity-100 hover:bg-[var(--theme-secondary-bg)]"
                    aria-label={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                >
                    <svg
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {isExpanded && (
                <div className="border-t border-[var(--theme-border)] px-1 pb-4">
                    <table className="w-full text-sm mt-1">
                        <thead>
                            <tr className="text-xs text-[var(--theme-text)] opacity-40 uppercase tracking-widest">
                                <th className="py-2 pl-4 pr-2 text-left font-500">Producto</th>
                                <th className="py-2 px-2 text-center font-500">Cant.</th>
                                <th className="py-2 px-2 text-right font-500">P. Unit.</th>
                                <th className="py-2 pl-2 pr-4 text-right font-500">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsLoading ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : expandedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-xs opacity-40">
                                        Sin productos
                                    </td>
                                </tr>
                            ) : (
                                expandedItems.map((item) => <ItemRow key={item.itemId} item={item} />)
                            )}
                        </tbody>
                        {!itemsLoading && expandedItems.length > 0 && (
                            <tfoot>
                                <tr className="border-t border-[var(--theme-border)]">
                                    <td colSpan={3} className="py-2 pl-4 text-xs font-700 text-[var(--theme-text)] opacity-50 uppercase tracking-widest">
                                        Total
                                    </td>
                                    <td className="py-2 pr-4 text-right font-800 text-[#88B04B]">
                                        {formatCurrency(order.total)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {onMarkReady && (
                <div className="flex justify-end border-t border-[var(--theme-border)] px-4 py-3">
                    {isSuccess ? (
                        <span className="flex items-center gap-1.5 text-sm font-600 text-[var(--color-primary)]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            ¡Marcado como listo!
                        </span>
                    ) : (
                        <button
                            onClick={() => onMarkReady(order)}
                            disabled={isMarking}
                            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-700 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                        >
                            {isMarking ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Procesando…
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Marcar como listo
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
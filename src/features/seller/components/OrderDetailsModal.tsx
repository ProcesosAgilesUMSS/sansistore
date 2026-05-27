import { createPortal } from 'react-dom';
import { X, Package, Clock3, ReceiptText } from 'lucide-react';
import type { Order } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';

interface Props {
  order: Order | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/70 px-4 py-3">
      <p className="text-[11px] font-800 uppercase tracking-[0.24em] text-(--theme-text) opacity-45">
        {label}
      </p>
      <p className="mt-1 wrap-break-words text-sm font-700 text-(--theme-text)">
        {value ?? 'No registrado'}
      </p>
    </div>
  );
}

export function OrderDetailsModal({ order, loading, error, onClose }: Props) {
  if (!order) return null;

  const items = order.items ?? [];
  const paymentAmount = order.paymentAmount ?? order.total;

  return createPortal(
    (
      <div
        className="fixed inset-0 z-999 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-(--theme-border) bg-(--theme-card-bg) shadow-2xl">
          <header className="border-b border-(--theme-border) px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-800 uppercase tracking-[0.28em] text-primary">
                  Detalle de pedido
                </p>
                <h2
                  id="order-details-title"
                  className="mt-2 text-2xl font-900 tracking-tight text-(--theme-text)"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  #{order.orderId.slice(-10).toUpperCase()}
                </h2>
                <p className="mt-1 text-sm text-(--theme-text) opacity-70">
                  Información esencial del pedido empaquetado.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) transition hover:border-primary hover:text-primary"
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-(--theme-border) bg-primary px-3 py-1 text-xs font-800 uppercase tracking-[0.2em] text-white">
                <Clock3 size={12} />
                {formatDate(order.createdAt)}
              </span>
              <span className="rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-1 text-xs font-800 uppercase tracking-[0.2em] text-(--theme-text)">
                {order.status}
              </span>
            </div>
          </header>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <article className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailRow label="Cliente" value={order.buyerName ?? 'Comprador desconocido'} />
                  <DetailRow label="Ubicación" value={order.locationLabel ?? 'No registrada'} />
                  <DetailRow label="Tipo" value={order.locationType ?? 'No registrado'} />
                </div>
              </article>

              <article className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <h3 className="text-lg font-800 tracking-tight text-(--theme-text)">
                    Productos
                  </h3>
                </div>

                {items.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-(--theme-border) px-4 py-5 text-sm text-(--theme-text) opacity-60">
                    No se encontraron productos para este pedido.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div key={item.itemId} className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-800 text-(--theme-text)">{item.productName}</p>
                            <p className="mt-1 text-sm text-(--theme-text) opacity-60">
                              {item.quantity} x {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="whitespace-nowrap font-800 text-primary">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-(--theme-border) bg-linear-to-br from-(--theme-card-bg) via-(--theme-card-bg) to-(--theme-secondary-bg)/60 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ReceiptText size={18} className="text-primary" />
                  <h3 className="text-lg font-800 tracking-tight text-(--theme-text)">
                    Resumen
                  </h3>
                </div>

                <div className="mt-4 grid gap-3">
                  <DetailRow label="Total" value={formatCurrency(order.total)} />
                  <DetailRow label="Monto de pago" value={formatCurrency(paymentAmount)} />
                </div>
              </article>

            </aside>
          </div>
        </section>
      </div>
    ),
    document.body);
}

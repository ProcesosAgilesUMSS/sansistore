import { useState } from 'react';
import { DollarSign, ReceiptText } from 'lucide-react';
import { useDailyCollections } from '../hooks/useDailyCollections';
import { useReservedOrdersPanel } from '../hooks/useReservedOrdersPanel';
import type { Order } from '../types';
import { OrderCard } from './OrderCard';
import { SectionHeader } from './SectionHeader';

const currencyFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

function formatDate(value?: string) {
  if (!value) return 'Hoy';
  return new Date(`${value}T00:00:00-04:00`).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function ReserveModal({
  isLoading,
  onCancel,
  onConfirm,
}: {
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-200 rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-2xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--theme-secondary-bg)">
          <svg
            className="h-7 w-7"
            style={{ color: 'var(--color-primary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
            />
          </svg>
        </div>

        <h2
          id="reserve-title"
          className="text-xl font-800 tracking-tight text-(--theme-text)"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Reservar pedido
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-(--theme-text) opacity-70">
          Este pedido pasará al panel de pedidos reservados.
        </p>

        <div className="mt-5 rounded-xl border border-(--theme-border) px-4 py-3">
          <p className="text-xs leading-relaxed text-(--theme-text) opacity-60">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-full border border-(--theme-border) px-4 py-3 text-sm font-600 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-700 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReservedOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    confirmed,
    reserved,
    loading,
    error,
    expandedOrderId,
    expandedItems,
    itemsLoading,
    toggleOrderDetail,
    reservingOrderId,
    reserveOrder,
    successOrderId,
  } = useReservedOrdersPanel();
  const {
    summary: dailyCollections,
    loading: collectionsLoading,
    error: collectionsError,
  } = useDailyCollections();
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  async function handleConfirm() {
    if (!pendingOrder) return;
    const orderId = pendingOrder.orderId;
    setPendingOrder(null);
    await reserveOrder(orderId);
  }

  return (
    <div className={embedded ? 'min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      {pendingOrder && (
        <ReserveModal
          isLoading={!!reservingOrderId}
          onCancel={() => setPendingOrder(null)}
          onConfirm={handleConfirm}
        />
      )}

      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <h1
          className="text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Reservar pedidos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Revisa los pedidos en estado creado, reserva los que correspondan y visualiza los ya reservados.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Cobrado hoy
              </p>
              <p
                className="mt-2 text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {collectionsLoading
                  ? 'Calculando...'
                  : currencyFormatter.format(dailyCollections?.totalCollected ?? 0)}
              </p>
              <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
                {collectionsError
                  ? collectionsError
                  : `Rendicion del ${formatDate(dailyCollections?.date)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--theme-secondary-bg) text-(--theme-text)">
              <ReceiptText size={21} />
            </div>
            <div>
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Pedidos cobrados
              </p>
              <p
                className="mt-2 text-3xl font-900 leading-tight text-(--theme-text)"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {collectionsLoading ? '...' : dailyCollections?.orderCount ?? 0}
              </p>
              <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
                Solo pedidos del vendedor actual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-800/40 dark:bg-red-900/20">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5"
            >
              <div className="mb-4 h-5 w-1/3 rounded bg-(--theme-secondary-bg)" />
              <div className="mb-3 h-4 w-1/4 rounded bg-(--theme-secondary-bg)" />
              <div className="h-10 rounded-xl bg-(--theme-secondary-bg)" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
            <SectionHeader title="Pedidos creados" count={confirmed.length} />
            {confirmed.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
                <p className="text-sm text-(--theme-text) opacity-50">
                  No hay pedidos por reservar en este momento.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {confirmed.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={expandedOrderId === order.orderId ? expandedItems : []}
                    itemsLoading={itemsLoading && expandedOrderId === order.orderId}
                    onToggle={toggleOrderDetail}
                    title="Reservar"
                    onClick={() => setPendingOrder(order)}
                    isMarking={reservingOrderId === order.orderId}
                    isSuccess={successOrderId === order.orderId}
                    successLabel="Pedido reservado"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
            <SectionHeader title="Pedidos reservados" count={reserved.length} />
            {reserved.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
                <p className="text-sm text-(--theme-text) opacity-50">
                  Aun no hay pedidos reservados.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reserved.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={expandedOrderId === order.orderId ? expandedItems : []}
                    itemsLoading={itemsLoading && expandedOrderId === order.orderId}
                    onToggle={toggleOrderDetail}
                    title=""
                    isMarking={false}
                    isSuccess={false}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

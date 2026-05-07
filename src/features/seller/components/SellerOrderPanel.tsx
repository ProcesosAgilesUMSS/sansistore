import { useState } from 'react';
import { useSellerOrders } from '../hooks/useSellerOrders';
import type { Order } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { OrderCard } from './OrderCard';

export default function SellerOrdersPanel() {
  const {
    reserved,
    ready,
    loading,
    error,
    expandedOrderId,
    expandedItems,
    itemsLoading,
    toggleOrderDetail,
    markingOrderId,
    markAsReady,
    successOrderId,
  } = useSellerOrders();

  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  const handleMarkReady = (order: Order) => {
    setPendingOrder(order);
  };

  const handleConfirm = async () => {
    if (!pendingOrder) return;
    const orderId = pendingOrder.orderId;
    setPendingOrder(null);
    await markAsReady(orderId);
  };

  const handleCancel = () => setPendingOrder(null);

  return (
    <div className="min-h-screen bg-(--theme-bg) px-4 pb-8 pt-12 md:px-8 md:pt-12">
      {pendingOrder && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={!!markingOrderId}
        />
      )}

      <header className="mb-6 rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) px-5 py-5 shadow-sm sm:px-6">
        <p
          className="text-xs font-700 uppercase tracking-[0.2em] mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Panel del Vendedor
        </p>
        <h1
          className="text-2xl font-900 text-(--theme-text) leading-tight sm:text-3xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Pedidos para entrega
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-(--theme-text) opacity-70 sm:text-[0.95rem]">
          Revisa y prepara los pedidos confirmados por los compradores.
        </p>
      </header>

      {error && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) p-4"
            >
              <div className="mb-3 h-5 w-1/3 rounded bg-(--theme-secondary-bg)" />
              <div className="h-4 w-1/4 rounded bg-(--theme-secondary-bg)" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2
                className="text-sm font-800 uppercase tracking-widest text-(--theme-text) opacity-60"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Reservados
              </h2>
              <span className="ml-auto rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1 text-xs font-700 text-(--theme-text)">
                {reserved.length}
              </span>
            </div>

            {reserved.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-(--theme-border] p-8 text-center">
                <p className="text-sm text-(--theme-text) opacity-40">
                  No hay pedidos reservados en este momento.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reserved.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={expandedOrderId === order.orderId ? expandedItems : []}
                    itemsLoading={itemsLoading && expandedOrderId === order.orderId}
                    onToggle={toggleOrderDetail}
                    onMarkReady={handleMarkReady}
                    isMarking={markingOrderId === order.orderId}
                    isSuccess={successOrderId === order.orderId}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2
                className="text-sm font-800 uppercase tracking-widest text-(--theme-text) opacity-60"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Listos para entrega
              </h2>
              <span className="ml-auto rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1 text-xs font-700 text-(--theme-text)">
                {ready.length}
              </span>
            </div>

            {ready.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-(--theme-border) p-8 text-center">
                <p className="text-sm text-(--theme-text) opacity-40">
                  Aún no hay pedidos marcados como listos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ready.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={expandedOrderId === order.orderId ? expandedItems : []}
                    itemsLoading={itemsLoading && expandedOrderId === order.orderId}
                    onToggle={toggleOrderDetail}
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

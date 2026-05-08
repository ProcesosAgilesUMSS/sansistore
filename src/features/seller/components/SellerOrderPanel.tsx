import { useState } from 'react';
import { useSellerOrders } from '../hooks/useSellerOrders';
import type { Order } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { OrderCard } from './OrderCard';
import { SectionHeader } from './SectionHeader';

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

  console.log('Reserved Orders:', reserved);
  console.log('Ready Orders:', ready);

  return (
    <div className="min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10">
      {pendingOrder && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={!!markingOrderId}
        />
      )}

      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <p
          className="mb-3 text-xs font-800 uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Panel del vendedor
        </p>

        <h1
          className="text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Pedidos para entrega
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Revisa y prepara los pedidos confirmados
          antes de su asignación a mensajeros.
        </p>
      </header>

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
            <SectionHeader
              title="Reservados"
              count={reserved.length}
            />

            {reserved.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--theme-secondary-bg)">
                  <svg
                    className="h-6 w-6 opacity-40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6"
                    />
                  </svg>
                </div>

                <p className="text-sm text-(--theme-text) opacity-50">
                  No hay pedidos reservados en este momento.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reserved.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={
                      expandedOrderId === order.orderId
                        ? expandedItems
                        : []
                    }
                    itemsLoading={
                      itemsLoading &&
                      expandedOrderId === order.orderId
                    }
                    onToggle={toggleOrderDetail}
                    title="Marcar como listo"
                    onClick={handleMarkReady}
                    isMarking={markingOrderId === order.orderId}
                    isSuccess={successOrderId === order.orderId}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
            <SectionHeader
              title="Listos para entrega"
              count={ready.length}
            />

            {ready.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--theme-secondary-bg)">
                  <svg
                    className="h-6 w-6 opacity-40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                </div>

                <p className="text-sm text-(--theme-text) opacity-50">
                  Aún no hay pedidos marcados como listos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {ready.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    isExpanded={expandedOrderId === order.orderId}
                    expandedItems={
                      expandedOrderId === order.orderId
                        ? expandedItems
                        : []
                    }
                    itemsLoading={
                      itemsLoading &&
                      expandedOrderId === order.orderId
                    }
                    title="Asignar a mensajero"
                    onClick={() => { window.location.href = '/seller/assign'; }}
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

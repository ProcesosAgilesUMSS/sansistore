import { useState } from 'react';
import { db } from '../../../lib/firebase';
import { useSellerOrders } from '../hooks/useSellerOrders';
import type { Order } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { CardOrder } from './CardOrder';
import { OrderDetailsModal } from './OrderDetailsModal';
import { SectionHeader } from './SectionHeader';
import { Header } from './Header';
import { fetchOrderDetails } from '../services/sellerServices';

export default function PackagedOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    reserved,
    loading,
    error,
    markingOrderId,
    markAsReady,
    successOrderId,
  } = useSellerOrders();

  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const orderDetails = await fetchOrderDetails(db, order.orderId);
      setSelectedOrder(orderDetails);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'No se pudieron cargar los detalles del pedido.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setDetailsLoading(false);
    setDetailsError(null);
  };

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      {pendingOrder && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={!!markingOrderId}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={detailsLoading}
          error={detailsError}
          onClose={handleCloseDetails}
        />
      )}

      <Header
        title="Pedidos Empaquetados"
        description="Revisa y prepara los pedidos empaquetados antes de su asignación a mensajeros."
      />

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
        <div className="grid gap-6">
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
        <div className="grid w-full gap-6">
          <section className="w-full p-5">
            <SectionHeader
              title="Empaquetados"
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
                  No hay pedidos empaquetados en este momento.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reserved.map((order) => (
                  <CardOrder
                    key={order.orderId}
                    order={order}
                    onViewDetails={handleViewDetails}
                    onPrimaryAction={handleMarkReady}
                    primaryActionLabel="Marcar como listo"
                    isPrimaryActionLoading={markingOrderId === order.orderId}
                    isPrimaryActionSuccess={successOrderId === order.orderId}
                    successLabel="Pedido marcado como listo."
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

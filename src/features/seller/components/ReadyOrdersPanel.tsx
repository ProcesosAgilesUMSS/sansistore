import { useState } from 'react';
import { useAssignOrders } from '../hooks/useAssignOrders';
import { SectionHeader } from './SectionHeader';
import { Header } from './Header'
import { fetchOrderDetails } from '../services/sellerServices';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AssignMessengerModal } from './AssignMessengerModal';
import { db } from '../../../lib/firebase';
import { CardOrder } from './CardOrder';

export default function ReadyOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    ready,
    messengers,
    loading,
    messengersLoading,
    error,
    selectedCourier,
    selectCourier,
    assigningOrderId,
    assignOrder,
  } = useAssignOrders();

  const [selectedOrder, setSelectedOrder] = useState<import('../types').Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<import('../types').Order | null>(null);

  const handleViewDetails = async (order: import('../types').Order) => {
    setSelectedOrder(order);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const details = await fetchOrderDetails(db, order.orderId);
      setSelectedOrder(details);
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'No se pudieron cargar los detalles del pedido.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setDetailsError(null);
    setDetailsLoading(false);
  };

  const handleOpenAssignModal = (order: import('../types').Order) => {
    setAssigningOrder(order);
  };

  const handleCloseAssignModal = () => setAssigningOrder(null);

  const handleConfirmAssign = async () => {
    if (!assigningOrder) return;
    await assignOrder(assigningOrder.orderId, assigningOrder.deliveryId ?? '');
    setAssigningOrder(null);
  };

  const skeletons = (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) p-4"
        >
          <div className="mb-3 h-5 w-1/3 rounded bg-(--theme-secondary-bg)" />
          <div className="mb-2 h-4 w-1/4 rounded bg-(--theme-secondary-bg)" />
          <div className="h-10 rounded-xl bg-(--theme-secondary-bg)" />
        </div>
      ))}
    </div>
  );

  const emptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--theme-secondary-bg)">
        <svg
          className="h-6 w-6 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <p className="text-sm text-(--theme-text) opacity-50">{message}</p>
    </div>
  );

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      <Header
        title="Pedidos listos"
        description="Revisa los pedidos listos y asigna a un mensajero."
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
          <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={detailsLoading}
          error={detailsError}
          onClose={handleCloseDetails}
        />
      )}

      {assigningOrder && (
        <AssignMessengerModal
          order={assigningOrder}
          messengers={messengers}
          selectedCourierId={selectedCourier[assigningOrder.orderId]}
          messengersLoading={messengersLoading}
          isLoading={assigningOrderId === assigningOrder.orderId}
          onSelectCourier={selectCourier}
          onConfirm={handleConfirmAssign}
          onClose={handleCloseAssignModal}
        />
      )}

      <div className="grid w-full gap-6">
        <section className="w-full rounded-3xl p-5">
          <SectionHeader title="Listos para asignar" count={ready.length} />

          {loading ? skeletons : ready.length === 0
            ? emptyState('No hay pedidos listos para asignar.')
            : (
              <div className="grid gap-4">
                {ready.map((order) => (
                  <CardOrder
                    key={order.orderId}
                    order={order}
                    onViewDetails={handleViewDetails}
                    onPrimaryAction={handleOpenAssignModal}
                    primaryActionLabel="Asignar mensajero"
                    isPrimaryActionLoading={false}
                  />
                ))}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

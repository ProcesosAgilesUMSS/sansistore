import { useState } from 'react';
import { useGetOrders } from '../hooks/useGetOrders';
import { useMarkOrderReady } from '../hooks/useMarkOrderReady';
import type { Order } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { CardOrder } from './CardOrder';
import { OrderDetailsModal } from './OrderDetailsModal';
import { Header } from './Header';
import { EmptyOrders } from './EmptyOrders';
import { SkeletonRows } from './SkeletonRows';
import { ErrorMessage } from './ErrorMessage';

export default function PackagedOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    orders: packaged,
    loading,
    error
  } = useGetOrders({ status: 'EMPAQUETADO', ordby: 'asc' });

  const {
    markAsReady,
    isLoading: isMarkingReady,
    isSuccess,
    error: markError,
    reset,
    currentOrderId
  } = useMarkOrderReady();

  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleMarkReady = (order: Order) => {
    setPendingOrder(order);
  };

  const handleConfirm = async () => {
    if (!pendingOrder) return;
    const orderId = pendingOrder.orderId;
    setPendingOrder(null);

    await markAsReady(orderId);

    reset();
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      <Header
        title="Pedidos Empaquetados"
        description="Revisa y prepara los pedidos empaquetados antes de su asignación a mensajeros."
      />

      {(error || markError) && (
        <ErrorMessage
          message={markError || error || 'Ha ocurrido un error.'}
        />
      )}


      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {pendingOrder && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setPendingOrder(null)}
          isLoading={isMarkingReady}
        />
      )}

      <div className="grid w-full gap-6">
        <section className="w-full rounded-3xl p-5">

          {loading ? (
            <SkeletonRows
              count={3}
            />
          ) : packaged.length === 0 ? (
            <EmptyOrders
              description="No hay pedidos empaquetados en este momento."
            />
          ) : (
            <div className="grid gap-4">
              {packaged.map((order) => (
                <CardOrder
                  key={order.orderId}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onPrimaryAction={handleMarkReady}
                  primaryActionLabel="Marcar como listo"
                  isPrimaryActionLoading={isMarkingReady && currentOrderId === order.orderId}
                  isPrimaryActionSuccess={isSuccess && currentOrderId === order.orderId}
                  successLabel="Pedido marcado como listo."
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

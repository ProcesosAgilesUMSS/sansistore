import { useState } from 'react';
import { useGetOrders } from '../hooks/useGetOrders';
import { useGetMessengers } from '../hooks/useGetMessengers';
import { useAssignOrdersToDelivery } from '../hooks/useAssignOrdersToDelivery';
import type { Order } from '../types';
import { SectionHeader } from './SectionHeader';
import { Header } from './Header';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AssignMessengerModal } from './AssignMessengerModal';
import { CardOrder } from './CardOrder';
import { EmptyOrders } from './EmptyOrders';
import { SkeletonRows } from './SkeletonRows';
import { ErrorMessage } from './ErrorMessage';

export default function ReadyOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    orders: ready,
    loading,
    error
  } = useGetOrders({ status: 'LISTO', ordby: 'desc' });

  const {
    messengers,
    loading: messengersLoading,
    error: messengersError
  } = useGetMessengers()

  const {
    assingToDelivery,
    isLoading: assignLoading,
    error: assignError,
    reset
  } = useAssignOrdersToDelivery()

  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOpenAssignModal = (order: Order) => {
    setAssigningOrder(order);
  };

  const handleCloseAssignModal = () => setAssigningOrder(null);

  const handleConfirmAssign = async () => {
    if (!assigningOrder) return;
    const courierId = selectedCourier[assigningOrder.orderId];
    if (!courierId || !assigningOrder.deliveryId) return;

    await assingToDelivery(assigningOrder.deliveryId, assigningOrder.orderId, courierId, false);
    setAssigningOrder(null);
    reset();
  };

  const handleSelectCourier = (orderId: string, courierId: string) => {
    setSelectedCourier((prev) => ({ ...prev, [orderId]: courierId }));
  };

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      <Header
        title="Pedidos listos"
        description="Revisa los pedidos listos y asigna a un mensajero."
      />

      {(error || assignError || messengersError) && (
        <ErrorMessage
          message={assignError || error || messengersError || 'Ha ocurrido un error.'}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {assigningOrder && (
        <AssignMessengerModal
          order={assigningOrder}
          messengers={messengers}
          selectedCourierId={selectedCourier[assigningOrder.orderId]}
          messengersLoading={messengersLoading}
          isLoading={assignLoading}
          onSelectCourier={handleSelectCourier}
          onConfirm={handleConfirmAssign}
          onClose={handleCloseAssignModal}
        />
      )}

      <div className="grid w-full gap-6">
        <section className="w-full rounded-3xl p-5">
          <SectionHeader title="Listos para asignar" count={ready.length} />

          {loading ? (
            <SkeletonRows
              count={3}
            />
          ) : ready.length === 0 ? (
            <EmptyOrders
              description="No hay pedidos listos para asignar." />
          ) : (
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

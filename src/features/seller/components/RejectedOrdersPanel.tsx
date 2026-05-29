import { useState } from 'react';
import { useGetOrders } from '../hooks/useGetOrders';
import type { Order } from '../types';
import { SectionHeader } from './SectionHeader';
import { Header } from './Header';
import { OrderDetailsModal } from './OrderDetailsModal';
import ReassignModal from './ReassignModal';
import { CardOrder } from './CardOrder';
import { EmptyOrders } from './EmptyOrders';
import { SkeletonRows } from './SkeletonRows';
import { ErrorMessage } from './ErrorMessage';
import { useGetMessengers } from '../hooks/useGetMessengers';
import { useRessignOrdersToDelivery } from '../hooks/useAssignOrdersToDelivery';

export default function RejectedOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const {
    orders: rejected,
    loading,
    error
  } = useGetOrders({ status: 'PENDIENTE REASIGNACION', ordby: 'asc' });


  const {
    messengers,
    loading: messengersLoading,
    error: messengersError
  } = useGetMessengers()

  const {
    reassingToDelivery,
    isLoading: assignLoading,
    error: assignError,
    reset
  } = useRessignOrdersToDelivery()

  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);

  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  const handleOpenReassignModal = (order: Order) => setReassigningOrder(order);
  const handleCloseReassignModal = () => setReassigningOrder(null);

  const handleSelectCourier = (orderId: string, courierId: string) => {
    setSelectedCourier((prev) => ({ ...prev, [orderId]: courierId }));
  };

  const handleConfirmReassign = async () => {
    if (!reassigningOrder) return;
    const courierId = selectedCourier[reassigningOrder.orderId];
    if (!courierId || !reassigningOrder.deliveryId) return;

    await reassingToDelivery(reassigningOrder.deliveryId, reassigningOrder.orderId, courierId)
    setReassigningOrder(null);
    reset();

  };

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      <Header title="Pedidos rechazados" description="Pedidos que requieren reasignación por haber sido rechazados por un mensajero." />

      {(error || assignError || messengersError) && (
        <ErrorMessage
          message={error || assignError || messengersError || 'Ha ocurrido un error.'}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseDetails} />
      )}

      {reassigningOrder && (
        <ReassignModal
          order={reassigningOrder}
          messengers={messengers}
          selectedCourierId={selectedCourier[reassigningOrder.orderId]}
          messengersLoading={messengersLoading}
          isLoading={assignLoading}
          onSelectCourier={handleSelectCourier}
          onConfirm={handleConfirmReassign}
          onClose={handleCloseReassignModal}
        />
      )}

      <div className="grid w-full gap-6">
        <section className="w-full rounded-3xl p-5">
          <SectionHeader title="Pendiente reasignación" count={rejected.length} />

          {loading ? (
            <SkeletonRows
              count={3}
            />
          ) : rejected.length === 0 ? (
            <EmptyOrders
              description="No hay pedidos pendientes de reasignación."
            />
          ) : (
            <div className="grid gap-4">
              {rejected.map((order) => (
                <CardOrder
                  key={order.orderId}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onPrimaryAction={handleOpenReassignModal}
                  primaryActionLabel="Reasignar mensajero"
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

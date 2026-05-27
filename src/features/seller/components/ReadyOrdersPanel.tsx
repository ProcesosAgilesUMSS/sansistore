import { useState } from 'react';
import { useAssignOrders } from '../hooks/useAssignOrders';
import { StatusPill } from './StatusPill';
import { SectionHeader } from './SectionHeader';
import { Header } from './Header'
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';
import { fetchOrderDetails } from '../services/sellerServices';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AssignMessengerModal } from './AssignMessengerModal';
import { db } from '../../../lib/firebase';

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
        description="Revisa los pedidos listos y asigna un mensajero desde una vista más visual."
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
              <div className="grid gap-4 2xl:grid-cols-2">
                {ready.map((order) => (
                  <article
                    key={order.orderId}
                    className="overflow-hidden rounded-[1.5rem] border border-(--theme-border) bg-gradient-to-br from-(--theme-card-bg) to-(--theme-secondary-bg)/40 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-800 uppercase tracking-[0.24em] text-(--theme-text) opacity-45">
                            Pedido listo
                          </p>
                          <h3 className="mt-1 text-xl font-900 tracking-tight text-(--theme-text)" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            #{order.orderId.slice(-10).toUpperCase()}
                          </h3>
                          <p className="mt-2 text-sm font-700 text-(--theme-text) opacity-80">
                            {order.buyerName ?? 'Comprador desconocido'}
                          </p>
                          <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                            {order.locationLabel ?? 'Ubicación no registrada'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
                            Total
                          </p>
                          <p className="font-900 text-2xl tracking-tight text-primary">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <StatusPill status={order.status} />
                        <span className="rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-1 text-xs font-700 text-(--theme-text) opacity-80">
                          {order.paymentStatus || 'Pago pendiente'}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                          <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                            Cliente
                          </p>
                          <p className="mt-1 text-sm font-700 text-(--theme-text)">
                            {order.buyerName ?? 'Comprador desconocido'}
                          </p>
                          <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                            {order.buyerEmail ?? 'Sin correo'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                          <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm font-700 text-(--theme-text)">
                            {formatDate(order.confirmedAt ?? order.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                            Actualizado {formatDate(order.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(order)}
                          className="inline-flex items-center justify-center rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary"
                        >
                          Ver detalles
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(order)}
                          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90"
                        >
                          Asignar mensajero
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

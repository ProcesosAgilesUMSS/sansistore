import { useState } from 'react';
import { RotateCcw, XCircle } from 'lucide-react';
import { useGetOrders } from '../hooks/useGetOrders';
import { useFailedOrderDecision } from '../hooks/useFailedOrderDecision';
import type { Order } from '../types';
import { Header } from './Header';
import { ErrorMessage } from './ErrorMessage';
import { EmptyOrders } from './EmptyOrders';
import { OrderDetailsModal } from './OrderDetailsModal';
import { SkeletonRows } from './SkeletonRows';
import { StatusPill } from './StatusPill';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';
import { parseOrderId } from '@/features/cart/services/orderService';

function DecisionModal({
  order,
  mode,
  isLoading,
  onConfirm,
  onClose,
}: {
  order: Order;
  mode: 'restart' | 'cancel';
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isRestart = mode === 'restart';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="failed-order-decision-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-200 rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-2xl">
        <div
          className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isRestart ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {isRestart ? <RotateCcw size={26} /> : <XCircle size={26} />}
        </div>

        <h2
          id="failed-order-decision-title"
          className="text-lg font-800 tracking-tight text-(--theme-text)"
        >
          {isRestart ? 'Reiniciar pedido' : 'Cancelar pedido'}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-(--theme-text) opacity-70">
          {isRestart
            ? 'El pedido volverá a estado RESERVADO para que el vendedor continúe el flujo.'
            : 'El pedido se cerrará como CANCELADO y la reserva de stock se liberará si aún seguía activa.'}
        </p>

        <div className="mt-5 rounded-2xl border border-(--theme-border) px-4 py-3">
          <p className="text-xs font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-45">
            Pedido
          </p>
          <p className="mt-1 text-sm font-700 text-(--theme-text)">
            {parseOrderId(order.orderId).friendlyName}
          </p>
          {order.incidentReason && (
            <p className="mt-2 text-xs text-(--theme-text) opacity-60">
              Motivo registrado: {order.incidentReason}
            </p>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full border border-(--theme-border) px-4 py-3 text-sm font-600 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-40"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-700 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60 ${
              isRestart ? 'bg-primary' : 'bg-red-500'
            }`}
          >
            {isLoading ? 'Procesando…' : isRestart ? 'Reiniciar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FailedOrderCard({
  order,
  onViewDetails,
  onRestart,
  onCancel,
  isRestarting,
  isCancelling,
  restartSuccess,
  cancelSuccess,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
  onRestart: (order: Order) => void;
  onCancel: (order: Order) => void;
  isRestarting: boolean;
  isCancelling: boolean;
  restartSuccess: boolean;
  cancelSuccess: boolean;
}) {
  const items = order.items ?? [];
  const visibleItems = items.slice(0, 3);
  const hiddenItems = Math.max(items.length - visibleItems.length, 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-(--theme-border) bg-linear-to-br from-(--theme-card-bg) to-(--theme-secondary-bg)/40 shadow-sm duration-200 hover:shadow-xl">
      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-(--theme-text) opacity-50">
                  {parseOrderId(order.orderId).uuid}
                </p>
                <h3
                  className="mt-1 text-lg font-bold tracking-tight text-(--theme-text)"
                >
                  {parseOrderId(order.orderId).friendlyName}
                </h3>
                <p className="mt-2 text-sm font-700 text-(--theme-text) opacity-80">
                  {order.buyerName ?? 'Comprador desconocido'}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  {order.buyerEmail ?? order.buyerInstitutionalId ?? 'Sin datos del comprador'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
                  Total
                </p>
                <p className="font-900 text-2xl tracking-tight text-primary">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={order.status} />
            </div>

            {order.incidentReason && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="text-xs font-800 uppercase tracking-[0.2em] opacity-70">
                  Motivo del fallo
                </p>
                <p className="mt-1 font-700">{order.incidentReason}</p>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Ubicación
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {order.locationLabel ?? 'No registrada'}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  {order.locationType ?? 'Tipo no registrado'}
                </p>
              </div>

              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Fecha
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  Actualizado {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Productos
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {items.length} producto{items.length === 1 ? '' : 's'}
                </p>
              </div>

              <span className="rounded-full border border-(--theme-border) bg-(--theme-card-bg) px-3 py-1 text-xs font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-70">
                Fallido
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {visibleItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-4 text-sm text-(--theme-text) opacity-60">
                  No se encontraron productos para este pedido.
                </div>
              ) : (
                visibleItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) px-4 py-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-800 text-(--theme-text)">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-sm font-800 text-primary">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {hiddenItems > 0 && (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-3 text-sm font-700 text-(--theme-text) opacity-65">
                  +{hiddenItems} producto{hiddenItems === 1 ? '' : 's'} más
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="inline-flex items-center justify-center rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary"
          >
            Ver detalles
          </button>

          <button
            type="button"
            onClick={() => onRestart(order)}
            disabled={isRestarting || isCancelling}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isRestarting ? 'Procesando…' : 'Reiniciar pedido'}
          </button>

          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={isRestarting || isCancelling}
            className="inline-flex items-center justify-center rounded-full border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-800 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            {isCancelling ? 'Procesando…' : 'Cancelar pedido'}
          </button>
        </div>

        {(restartSuccess || cancelSuccess) && (
          <p className={`mt-4 text-sm font-700 ${restartSuccess ? 'text-primary' : 'text-red-600'}`}>
            {restartSuccess
              ? 'El pedido fue reiniciado y volvió a RESERVADO.'
              : 'El pedido fue cancelado correctamente.'}
          </p>
        )}
      </div>
    </article>
  );
}

export default function FailedOrdersPanel({ embedded = false }: { embedded?: boolean }) {
  const { orders, loading, error } = useGetOrders({ status: 'NO ENTREGADO', ordby: 'desc' });
  const {
    loadingAction,
    successAction,
    error: decisionError,
    restartOrder,
    cancelOrder,
  } = useFailedOrderDecision();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [decisionOrder, setDecisionOrder] = useState<Order | null>(null);
  const [decisionMode, setDecisionMode] = useState<'restart' | 'cancel' | null>(null);

  const openRestartDecision = (order: Order) => {
    setDecisionOrder(order);
    setDecisionMode('restart');
  };

  const openCancelDecision = (order: Order) => {
    setDecisionOrder(order);
    setDecisionMode('cancel');
  };

  const closeDecisionModal = () => {
    setDecisionOrder(null);
    setDecisionMode(null);
  };

  const handleConfirmDecision = async () => {
    if (!decisionOrder || !decisionMode) return;

    const orderId = decisionOrder.orderId;
    const mode = decisionMode;

    closeDecisionModal();

    if (mode === 'restart') {
      await restartOrder(orderId);
      return;
    }

    await cancelOrder(orderId);
  };

  return (
    <div className={embedded ? 'w-full min-w-0' : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'}>
      <Header
        title="Pedidos fallidos"
        description="Decide si un pedido no entregado debe reiniciarse para continuar el flujo o cerrarse como cancelado."
      />

      {(error || decisionError) && (
        <ErrorMessage message={error || decisionError || 'Ha ocurrido un error.'} />
      )}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {decisionOrder && decisionMode && (
        <DecisionModal
          order={decisionOrder}
          mode={decisionMode}
          isLoading={
            loadingAction?.orderId === decisionOrder.orderId &&
            loadingAction.action === decisionMode
          }
          onConfirm={handleConfirmDecision}
          onClose={closeDecisionModal}
        />
      )}

      <div className="grid w-full gap-6">
        <section className="w-full rounded-3xl p-5">

          {loading ? (
            <SkeletonRows count={3} />
          ) : orders.length === 0 ? (
            <EmptyOrders description="No hay pedidos fallidos pendientes de decisión." />
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <FailedOrderCard
                  key={order.orderId}
                  order={order}
                  onViewDetails={setSelectedOrder}
                  onRestart={openRestartDecision}
                  onCancel={openCancelDecision}
                  isRestarting={
                    loadingAction?.orderId === order.orderId &&
                    loadingAction.action === 'restart'
                  }
                  isCancelling={
                    loadingAction?.orderId === order.orderId &&
                    loadingAction.action === 'cancel'
                  }
                  restartSuccess={
                    successAction?.orderId === order.orderId &&
                    successAction.action === 'restart'
                  }
                  cancelSuccess={
                    successAction?.orderId === order.orderId &&
                    successAction.action === 'cancel'
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

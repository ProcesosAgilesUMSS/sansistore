import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  ClipboardList,
  Eye,
  LoaderCircle,
  MapPin,
  NotebookText,
  PackageCheck,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import {
  backfillCourierOrderCodes,
  markOrderAsDelivered,
  subscribeToCourierOrders,
} from '../services/courierOrdersService';
import type { CourierDashboardStats, CourierOrder } from '../types';

const moneyFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const emptyStats: CourierDashboardStats = {
  pendingCount: 0,
  deliveredTodayCount: 0,
  pendingCashTotal: 0,
};

const formatMoney = (value: number) =>
  moneyFormatter.format(value).replace('BOB', 'Bs').trim();

const INVALID_AMOUNT_MESSAGE =
  'No se puede mostrar el monto a cobrar. Verifique el detalle del pedido.';

const pageClass = 'min-h-screen bg-bg-light pt-24 pb-12 text-text-light';
const cardBaseClass =
  'rounded-[28px] border border-border-light bg-card-bg-light px-7 py-8 shadow-[0_14px_30px_rgba(38,33,22,0.10)]';
const sectionCardClass =
  'rounded-[28px] border border-border-light bg-card-bg-light px-5 py-6 shadow-[0_14px_30px_rgba(38,33,22,0.10)] sm:px-7';
const badgeClass =
  'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold';
const mutedTextClass = 'text-text-light opacity-60';
const iconClass = 'text-text-light opacity-55';
const ghostButtonClass =
  'rounded-2xl border border-border-light bg-card-bg-light px-5 py-3 text-sm font-bold text-text-light transition hover:border-primary hover:text-primary';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-bg-dark transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

function OrderDetailView({
  selectedOrder,
  selectedItemsCount,
  selectedOrderHasValidAmount,
  updatingOrderId,
  onBack,
  onOpenMaps,
  onMarkDelivered,
}: {
  selectedOrder: CourierOrder;
  selectedItemsCount: number;
  selectedOrderHasValidAmount: boolean;
  updatingOrderId: string;
  onBack: () => void;
  onOpenMaps: (order: CourierOrder) => void;
  onMarkDelivered: (order: CourierOrder) => Promise<void>;
}) {
  return (
    <section className={pageClass}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-text-light opacity-75 transition hover:text-primary hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pedidos
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-[-0.04em]">
            Detalle de cobro del pedido
          </h1>
          <p className={`mt-2 text-sm font-semibold ${mutedTextClass}`}>
            Verifica el pedido antes de marcarlo como entregado.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-4">
            <div className={sectionCardClass}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {selectedOrder.orderCode}
                </h2>
                <span className={`${badgeClass} bg-[#fff2b8] py-1 text-[#aa7300]`}>
                  Cobrar
                </span>
                <span className={`${badgeClass} bg-primary/10 py-1 text-primary`}>
                  {selectedOrder.paymentStatusLabel}
                </span>
              </div>

              <div className="mt-6">
                <p className={`text-sm font-medium ${mutedTextClass}`}>Cliente</p>
                <p className="mt-1 text-3xl font-medium tracking-[-0.03em]">
                  {selectedOrder.buyerName}
                </p>
              </div>

              {!selectedOrderHasValidAmount ? (
                <div className="mt-5 rounded-2xl border border-[#f59e0b]/25 bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#9a3412] dark:border-[#f59e0b]/20 dark:bg-[#2a2117] dark:text-[#fdba74]">
                  {INVALID_AMOUNT_MESSAGE}
                </div>
              ) : null}
            </div>

            <div className={sectionCardClass}>
              <h3 className="text-lg font-black">Productos</h3>
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3">
                {selectedOrder.items.length === 0 ? (
                  <p className={`py-4 text-sm font-semibold ${mutedTextClass}`}>
                    Este pedido no tiene items visibles en el documento.
                  </p>
                ) : (
                  selectedOrder.items.map((item, index) => (
                    <div
                      key={`${selectedOrder.id}-${item.productId}`}
                      className={index === 0 ? '' : 'border-t border-primary/20 pt-4'}
                    >
                      <p className="text-lg font-medium">{item.name}</p>
                      <p className="mt-1 text-sm font-medium text-text-light opacity-70">
                        Cantidad: {item.quantity} | Precio: {formatMoney(item.subtotal)}
                      </p>
                      {index < selectedOrder.items.length - 1 ? (
                        <div className="mt-4 border-b border-primary/20" />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-border-light bg-card-bg-light px-5 py-6 shadow-[0_14px_30px_rgba(38,33,22,0.10)] sm:grid-cols-3 sm:px-7">
              <div className="flex items-start gap-3">
                <Wallet className={`mt-1 h-5 w-5 ${iconClass}`} />
                <div>
                  <p className={`text-sm font-medium ${mutedTextClass}`}>
                    Metodo de pago
                  </p>
                  <p className="text-lg font-medium">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className={`mt-1 h-5 w-5 ${iconClass}`} />
                <div>
                  <p className={`text-sm font-medium ${mutedTextClass}`}>
                    Metodo de envio
                  </p>
                  <p className="text-lg font-medium">{selectedOrder.deliveryMethod}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ClipboardList className={`mt-1 h-5 w-5 ${iconClass}`} />
                <div>
                  <p className={`text-sm font-medium ${mutedTextClass}`}>
                    Condiciones especiales
                  </p>
                  <p className="text-lg font-medium">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className={ghostButtonClass}>
                Solicitar producto
              </button>
              <button
                type="button"
                onClick={() => onOpenMaps(selectedOrder)}
                className={`inline-flex items-center gap-2 ${ghostButtonClass}`}
              >
                <MapPin className="h-4 w-4" />
                Abrir en Maps
              </button>
            </div>

            <div className={sectionCardClass}>
              <h3 className="text-2xl font-black tracking-[-0.04em]">
                Resumen del cobro
              </h3>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <ReceiptText className={`mt-1 h-5 w-5 ${iconClass}`} />
                  <div>
                    <p className="text-xl font-medium">
                      {selectedOrderHasValidAmount
                        ? formatMoney(selectedOrder.total)
                        : INVALID_AMOUNT_MESSAGE}
                    </p>
                    <p className={`text-sm font-medium ${mutedTextClass}`}>
                      Recibimiento
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <NotebookText className={`mt-1 h-5 w-5 ${iconClass}`} />
                  <div>
                    <p className="text-xl font-medium">Sin observaciones</p>
                    <p className={`text-sm font-medium ${mutedTextClass}`}>
                      Observaciones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="self-start rounded-[28px] border border-border-light bg-card-bg-light p-5 shadow-[0_14px_30px_rgba(38,33,22,0.10)] sm:p-6">
            <div className="rounded-3xl border border-primary/25 bg-primary/10 p-5">
              <p className="text-sm font-medium text-text-light opacity-70">
                Te llevas a cobrar
              </p>
              <p className="mt-1 text-3xl font-medium tracking-[-0.03em]">
                {selectedOrderHasValidAmount
                  ? formatMoney(selectedOrder.total)
                  : 'Monto no disponible'}
              </p>
              <p className="mt-2 text-sm font-medium text-text-light opacity-70">
                {selectedItemsCount} items en este pedido
              </p>

              <div className="my-5 border-t border-primary/20" />

              <p className="text-sm font-medium text-text-light opacity-70">
                Monto a cobrar
              </p>
              {selectedOrderHasValidAmount ? (
                <p className="mt-2 text-5xl font-medium tracking-[-0.05em] text-primary">
                  {formatMoney(selectedOrder.total)}
                </p>
              ) : (
                <p className="mt-2 text-base font-semibold leading-6 text-[#9a3412] dark:text-[#fdba74]">
                  {INVALID_AMOUNT_MESSAGE}
                </p>
              )}

              <div className="mt-6 space-y-3 text-base">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text-light opacity-80">
                    Subtotal
                  </span>
                  <span className="font-medium">
                    {formatMoney(selectedOrder.productsTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text-light opacity-80">
                    Costo de entrega
                  </span>
                  <span className="font-medium">
                    {formatMoney(selectedOrder.additionalCharges)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text-light opacity-80">
                    Descuento
                  </span>
                  <span className="font-medium">Bs 0</span>
                </div>
              </div>

              <div className="mt-4 border-t border-primary/20 pt-4">
                <div className="flex items-center justify-between gap-4 text-lg">
                  <span className="font-medium text-primary">Total final</span>
                  <span className="font-medium text-primary">
                    {selectedOrderHasValidAmount
                      ? formatMoney(selectedOrder.total)
                      : 'Monto no disponible'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button type="button" disabled className={`w-full ${ghostButtonClass}`}>
                Registrar pago
              </button>
              <p className="text-xs font-semibold text-text-light opacity-55">
                El monto a cobrar es de solo lectura en esta vista.
              </p>
              <button
                type="button"
                onClick={() => onMarkDelivered(selectedOrder)}
                disabled={
                  updatingOrderId === selectedOrder.id || !selectedOrderHasValidAmount
                }
                className={`w-full ${primaryButtonClass}`}
              >
                {updatingOrderId === selectedOrder.id ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                Marcar como entregado
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function CourierDashboard() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<CourierOrder[]>([]);
  const [stats, setStats] = useState<CourierDashboardStats>(emptyStats);
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToCourierOrders((payload) => {
      setOrders(payload.orders);
      setPendingOrders(payload.pendingOrders);
      setStats(payload.stats);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const syncOrders = async () => {
      try {
        setSyncing(true);
        await backfillCourierOrderCodes();
      } catch {
        // Ignore sync errors. The dashboard has local fallbacks.
      } finally {
        setSyncing(false);
      }
    };

    void syncOrders();
  }, []);

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === 'Entregado'),
    [orders]
  );

  const handleMarkDelivered = async (order: CourierOrder) => {
    try {
      setErrorMessage('');
      setUpdatingOrderId(order.id);
      await markOrderAsDelivered(order);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    } catch {
      setErrorMessage('No se pudo actualizar el pedido. Intente nuevamente.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const handleOpenMaps = (order: CourierOrder) => {
    const query = encodeURIComponent(
      `${order.deliveryZone}, Cochabamba, Bolivia`
    );
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const selectedItemsCount = selectedOrder
    ? selectedOrder.items.reduce((count, item) => count + item.quantity, 0)
    : 0;

  const selectedOrderExpectedTotal = selectedOrder
    ? Number(
        (selectedOrder.productsTotal + selectedOrder.additionalCharges).toFixed(2)
      )
    : 0;

  const selectedOrderHasValidAmount = selectedOrder
    ? Number.isFinite(selectedOrder.total) &&
      selectedOrder.total > 0 &&
      Number.isFinite(selectedOrder.productsTotal) &&
      Number.isFinite(selectedOrder.additionalCharges) &&
      Number(selectedOrder.total.toFixed(2)) === selectedOrderExpectedTotal
    : false;

  if (selectedOrder) {
    return (
      <OrderDetailView
        selectedOrder={selectedOrder}
        selectedItemsCount={selectedItemsCount}
        selectedOrderHasValidAmount={selectedOrderHasValidAmount}
        updatingOrderId={updatingOrderId}
        onBack={() => setSelectedOrder(null)}
        onOpenMaps={handleOpenMaps}
        onMarkDelivered={handleMarkDelivered}
      />
    );
  }

  return (
    <section className={pageClass}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
            Operacion de entregas
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Panel del Mensajero
              </h1>
              <p className={`mt-2 max-w-2xl text-sm font-semibold ${mutedTextClass}`}>
                Gestiona pedidos pendientes, revisa lo cobrado y registra las
                entregas del dia.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-card-bg-light px-4 py-2 text-sm font-semibold text-text-light opacity-80 shadow-[0_10px_24px_rgba(18,32,56,0.08)]">
              {syncing ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <PackageCheck className="h-4 w-4 text-primary" />
              )}
              Sincronizando datos de pedidos
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-3">
          <article className={cardBaseClass}>
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff2b8] text-[#d08a00]">
                <Box className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-light opacity-70">
                  Pendientes
                </p>
                <strong className="text-[3rem] leading-none font-black tracking-[-0.05em]">
                  {stats.pendingCount}
                </strong>
              </div>
            </div>
          </article>

          <article className={cardBaseClass}>
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-light opacity-70">
                  Entregados hoy
                </p>
                <strong className="text-[3rem] leading-none font-black tracking-[-0.05em]">
                  {stats.deliveredTodayCount}
                </strong>
              </div>
            </div>
          </article>

          <article className={cardBaseClass}>
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-light opacity-70">
                  Total a cobrar
                </p>
                <strong className="text-[2.7rem] leading-none font-black tracking-[-0.05em]">
                  {formatMoney(stats.pendingCashTotal)}
                </strong>
              </div>
            </div>
          </article>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-border-light bg-card-bg-light shadow-[0_16px_36px_rgba(32,28,20,0.12)]">
          <div className="border-b border-border-light px-8 py-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">
              Pedidos pendientes
            </h2>
            <p className="mt-1 text-sm font-semibold text-text-light opacity-55">
              Pedidos pendientes de entrega y cobro contra entrega.
            </p>
          </div>

          {errorMessage ? (
            <div className="border-b border-[#f97316]/15 bg-[#fff7ed] px-8 py-4 text-sm font-semibold text-[#9a3412] dark:border-[#f97316]/10 dark:bg-[#2a2117] dark:text-[#fdba74]">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center px-8 py-12 text-text-light opacity-55">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <p className="text-lg font-bold">No hay pedidos pendientes.</p>
              <p className="mt-2 text-sm font-semibold text-text-light opacity-55">
                Los pedidos entregados hoy aparecen reflejados en las metricas
                superiores.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-secondary-bg-light/50 text-sm font-black uppercase tracking-[0.08em] text-text-light">
                  <tr>
                    <th className="px-8 py-5">Codigo</th>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Zona</th>
                    <th className="px-8 py-5">Monto</th>
                    <th className="px-8 py-5">Estado</th>
                    <th className="px-8 py-5">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => {
                    const expectedTotal = Number(
                      (order.productsTotal + order.additionalCharges).toFixed(2)
                    );
                    const hasValidAmount =
                      Number.isFinite(order.total) &&
                      order.total > 0 &&
                      Number(order.total.toFixed(2)) === expectedTotal;

                    return (
                      <tr
                        key={order.id}
                        className="border-t border-border-light text-[1.05rem] text-text-light"
                      >
                        <td className="px-8 py-5 font-medium">{order.orderCode}</td>
                        <td className="px-8 py-5 font-medium">{order.buyerName}</td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-2 font-medium text-text-light opacity-75">
                            <MapPin className="h-4 w-4" />
                            {order.deliveryZone}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-medium">
                          {hasValidAmount
                            ? formatMoney(order.total)
                            : 'Monto no disponible'}
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`${badgeClass} bg-[#fff2b8] py-1 text-[#aa7300]`}
                          >
                            {order.paymentStatusLabel}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-text-light px-5 py-3 text-sm font-bold text-bg-light transition hover:opacity-90"
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkDelivered(order)}
                              disabled={updatingOrderId === order.id || !hasValidAmount}
                              className={primaryButtonClass}
                            >
                              {updatingOrderId === order.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <BadgeCheck className="h-4 w-4" />
                              )}
                              Marcar entregado
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[26px] border border-border-light bg-card-bg-light/80 px-6 py-5 shadow-[0_10px_24px_rgba(18,32,56,0.06)] backdrop-blur">
          <p className="text-sm font-semibold text-text-light opacity-65">
            Historial entregado:{' '}
            <span className="font-black text-text-light">
              {deliveredOrders.length}
            </span>{' '}
            pedidos registrados como entregados.
          </p>
        </div>
      </div>
    </section>
  );
}

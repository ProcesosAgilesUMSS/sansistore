import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  PackageX,
  RotateCcw,
  X,
} from 'lucide-react';
import { parseOrderId } from '@/features/cart/services/orderService';
import { useDeliveryFailureReasons } from '../hooks/useDeliveryFailureReasons';
import type { Order } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';
import {
  DELIVERY_FAILURE_REASON_OPTIONS,
  type DeliveryFailureReason,
  type DeliveryFailureReasonRecord,
} from '../services/deliveryFailureReasonsService';
import type { CustomerReturnReasonRecord } from '../hooks/useDeliveryFailureReasons';
import { RETURN_REASON_LABELS } from '@/features/orders/types';
import { EmptyOrders } from './EmptyOrders';
import { ErrorMessage } from './ErrorMessage';
import { Header } from './Header';
import { OrderDetailsModal } from './OrderDetailsModal';
import { SectionHeader } from './SectionHeader';
import { SkeletonRows } from './SkeletonRows';
import { StatusPill } from './StatusPill';

function ReturnedOrderCard({
  order,
  isSubmitting,
  onViewDetails,
  onRegister,
}: {
  order: Order;
  isSubmitting: boolean;
  onViewDetails: (order: Order) => void;
  onRegister: (order: Order) => void;
}) {
  const items = order.items ?? [];
  const visibleItems = items.slice(0, 3);
  const hiddenItems = Math.max(items.length - visibleItems.length, 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-(--theme-border) bg-linear-to-br from-(--theme-card-bg) to-(--theme-secondary-bg)/40 shadow-sm duration-200 hover:shadow-xl">
      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-(--theme-text) opacity-50">
                  {parseOrderId(order.orderId).uuid}
                </p>
                <h3
                  className="mt-1 text-xl font-bold tracking-tight text-(--theme-text)"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
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

              <div className="text-left sm:text-right">
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-(--theme-warning-border) bg-(--theme-warning-bg) px-2.5 py-0.5 text-xs font-700 text-(--theme-warning)">
                <RotateCcw size={13} />
                Motivo pendiente
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Ubicacion
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {order.locationLabel ?? 'No registrada'}
                </p>
                <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                  {order.locationType ?? 'Tipo no registrado'}
                </p>
              </div>

              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3">
                <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
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
                <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
                  Productos
                </p>
                <p className="mt-1 text-sm font-700 text-(--theme-text)">
                  {items.length} producto{items.length === 1 ? '' : 's'}
                </p>
              </div>

              <span className="rounded-full border border-(--theme-border) bg-(--theme-card-bg) px-3 py-1 text-[11px] font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-70">
                Rechazado
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
                  +{hiddenItems} producto{hiddenItems === 1 ? '' : 's'} mas
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="inline-flex items-center justify-center rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary"
          >
            Ver detalles
          </button>

          <button
            type="button"
            onClick={() => onRegister(order)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Registrar motivo'}
          </button>
        </div>
      </div>
    </article>
  );
}

function RegisteredReasonCard({ reason }: { reason: DeliveryFailureReasonRecord }) {
  return (
    <article className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-lg font-900 tracking-tight text-(--theme-text)"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {parseOrderId(reason.orderId).friendlyName}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--theme-success-border) bg-(--theme-success-bg) px-2.5 py-0.5 text-xs font-700 text-(--theme-success)">
              <CheckCircle2 size={13} />
              Registrado
            </span>
          </div>

          <p className="mt-2 text-sm font-700 text-(--theme-text) opacity-80">
            {reason.buyerName ?? reason.buyerId ?? 'Comprador desconocido'}
          </p>
          <p className="mt-3 text-sm font-800 text-(--theme-text)">
            {reason.reason}
          </p>
          {reason.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--theme-text) opacity-65">
              {reason.description}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 px-4 py-3 md:text-right">
          <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
            Registro
          </p>
          <p className="mt-1 text-sm font-700 text-(--theme-text)">
            {reason.registeredByName}
          </p>
          <p className="mt-1 text-xs text-(--theme-text) opacity-55">
            {reason.registeredAt
              ? reason.registeredAt.toDate().toLocaleString('es-BO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Pendiente'}
          </p>
        </div>
      </div>
    </article>
  );
}

function CustomerReturnReasonCard({
  reason,
  order,
}: {
  reason: CustomerReturnReasonRecord;
  order?: Order;
}) {
  const reasonLabel = RETURN_REASON_LABELS[reason.reason as keyof typeof RETURN_REASON_LABELS] ?? reason.reason;

  return (
    <article className="rounded-3xl border border-(--theme-info-border) bg-(--theme-info-bg) p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-lg font-900 tracking-tight text-(--theme-text)"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {parseOrderId(reason.orderId).friendlyName}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--theme-info-border) bg-(--theme-card-bg) px-2.5 py-0.5 text-xs font-700 text-(--theme-info)">
              <CheckCircle2 size={13} />
              Motivo del cliente
            </span>
          </div>

          <p className="mt-2 text-sm font-700 text-(--theme-text) opacity-80">
            {order?.buyerName ?? reason.buyerId ?? 'Comprador desconocido'}
          </p>
          <p className="mt-3 text-sm font-800 text-(--theme-text)">
            {reasonLabel}
          </p>
          {reason.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--theme-text) opacity-65">
              {reason.description}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-2xl border border-(--theme-info-border) bg-(--theme-card-bg) px-4 py-3 md:text-right">
          <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
            Solicitud
          </p>
          <p className="mt-1 text-sm font-700 text-(--theme-text)">
            Cliente
          </p>
          <p className="mt-1 text-xs text-(--theme-text) opacity-55">
            {reason.createdAt
              ? reason.createdAt.toDate().toLocaleString('es-BO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Pendiente'}
          </p>
        </div>
      </div>
    </article>
  );
}

function ReasonModal({
  order,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: {
  order: Order;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (payload: {
    order: Order;
    reason: DeliveryFailureReason;
    description?: string;
  }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<DeliveryFailureReason | ''>('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const needsDescription = reason === 'Otro';

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!reason) {
      setValidationError('Selecciona un motivo antes de guardar.');
      return;
    }

    if (needsDescription && !description.trim()) {
      setValidationError("Describe el motivo cuando seleccionas 'Otro'.");
      return;
    }

    setValidationError(null);

    const saved = await onSubmit({
      order,
      reason,
      description: description.trim(),
    });

    if (saved) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="failure-reason-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-(--theme-border) p-5 sm:p-6">
          <div className="min-w-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText size={24} />
            </div>
            <h2
              id="failure-reason-title"
              className="text-xl font-900 tracking-tight text-(--theme-text)"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Registrar motivo de rechazo
            </h2>
            <p className="mt-1 text-sm text-(--theme-text) opacity-60">
              {parseOrderId(order.orderId).friendlyName} - {order.buyerName ?? 'Comprador desconocido'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-2 text-(--theme-text) opacity-60 transition hover:bg-(--theme-secondary-bg) hover:opacity-100 disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 px-4 py-3">
            <p className="text-[11px] font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-45">
              Pedido rechazado
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusPill status={order.status} />
              <span className="text-sm font-800 text-primary">
                {formatCurrency(order.total)}
              </span>
              <span className="text-sm text-(--theme-text) opacity-60">
                {formatDate(order.updatedAt)}
              </span>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-800 text-(--theme-text)">
              Motivo del fallo de entrega
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_FAILURE_REASON_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-700 transition ${
                    reason === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-(--theme-border) text-(--theme-text) hover:border-primary/40 hover:bg-(--theme-secondary-bg)'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery-failure-reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => {
                      setReason(option);
                      setValidationError(null);
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <label
              htmlFor="delivery-failure-description"
              className="mb-2 block text-sm font-800 text-(--theme-text)"
            >
              Descripcion {needsDescription ? '(obligatoria)' : '(opcional)'}
            </label>
            <textarea
              id="delivery-failure-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={350}
              placeholder="Agrega detalles utiles para el analisis del fallo."
              className="w-full resize-none rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg) p-4 text-sm text-(--theme-text) outline-none transition placeholder:text-(--theme-text)/40 focus:border-primary"
            />
            <p className="mt-2 text-right text-xs text-(--theme-text) opacity-45">
              {description.length}/350
            </p>
          </div>

          {(validationError || submitError) && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-3 text-sm font-700 text-(--theme-error)">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{validationError || submitError}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-(--theme-border) p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Guardar motivo
          </button>
        </div>
      </section>
    </div>
  );
}

export default function RegisterFailureReasons({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const {
    user,
    ordersAwaitingReason,
    returnedOrders,
    registeredReasons,
    customerReturnReasons,
    loading,
    loadingOrders,
    loadingReasons,
    loadingCustomerReturns,
    error,
    submitError,
    submittingOrderId,
    registerReason,
    clearSubmitError,
  } = useDeliveryFailureReasons();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const openRegisterModal = (order: Order) => {
    clearSubmitError();
    setActiveOrder(order);
  };

  return (
    <div
      className={
        embedded
          ? 'w-full min-w-0'
          : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'
      }
    >
      <Header
        title="Motivos de fallos de entrega"
        description="Registra el motivo de pedidos rechazados cuando el cliente no haya registrado ya la razon."
      />

      {!user && !loading && (
        <ErrorMessage message="Debes iniciar sesion como vendedor para registrar motivos." />
      )}

      {error && <ErrorMessage message={error} />}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {activeOrder && (
        <ReasonModal
          order={activeOrder}
          isSubmitting={submittingOrderId === activeOrder.orderId}
          submitError={submitError}
          onSubmit={registerReason}
          onClose={() => setActiveOrder(null)}
        />
      )}

      <div className="grid w-full gap-8">
        <section className="w-full rounded-3xl p-5">
          <SectionHeader title="Rechazados pendientes" count={ordersAwaitingReason.length} />

          {loadingOrders ? (
            <SkeletonRows count={3} />
          ) : ordersAwaitingReason.length === 0 ? (
            <EmptyOrders description="No hay pedidos rechazados pendientes de motivo." />
          ) : (
            <div className="grid gap-4">
              {ordersAwaitingReason.map((order) => (
                <ReturnedOrderCard
                  key={order.orderId}
                  order={order}
                  isSubmitting={submittingOrderId === order.orderId}
                  onViewDetails={setSelectedOrder}
                  onRegister={openRegisterModal}
                />
              ))}
            </div>
          )}
        </section>

        <section className="w-full rounded-3xl p-5">
          <div className="mb-6 rounded-3xl border border-(--theme-border) bg-linear-to-r from-(--theme-card-bg) via-(--theme-card-bg) to-(--theme-secondary-bg)/55 p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--theme-info) text-white">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-800 uppercase tracking-[0.26em] text-(--theme-text) opacity-45">
                    Cliente
                  </p>
                  <h2
                    className="mt-1 text-base font-900 tracking-tight text-(--theme-text) md:text-lg"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Motivos ya registrados por cliente
                  </h2>
                </div>
              </div>

              <span className="inline-flex items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1.5 text-xs font-800 text-(--theme-text)">
                {customerReturnReasons.length} registros
              </span>
            </div>
          </div>

          {loadingCustomerReturns ? (
            <SkeletonRows count={2} />
          ) : customerReturnReasons.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-(--theme-border) bg-(--theme-card-bg) p-8 text-center">
              <p className="text-sm font-700 text-(--theme-text) opacity-65">
                No hay pedidos rechazados con motivo registrado por el cliente.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customerReturnReasons.map((reason) => (
                <CustomerReturnReasonCard
                  key={reason.id}
                  reason={reason}
                  order={returnedOrders.find((order) => order.orderId === reason.orderId)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="w-full rounded-3xl p-5">
          <div className="mb-6 rounded-3xl border border-(--theme-border) bg-linear-to-r from-(--theme-card-bg) via-(--theme-card-bg) to-(--theme-secondary-bg)/55 p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                  <ClipboardList size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-800 uppercase tracking-[0.26em] text-(--theme-text) opacity-45">
                    Historial
                  </p>
                  <h2
                    className="mt-1 text-base font-900 tracking-tight text-(--theme-text) md:text-lg"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Motivos registrados
                  </h2>
                </div>
              </div>

              <span className="inline-flex items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1.5 text-xs font-800 text-(--theme-text)">
                {registeredReasons.length} registros
              </span>
            </div>
          </div>

          {loadingReasons ? (
            <SkeletonRows count={2} />
          ) : registeredReasons.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-(--theme-border) bg-(--theme-card-bg) p-8 text-center">
              <PackageX className="mx-auto mb-3 text-(--theme-text) opacity-35" size={34} />
              <p className="text-sm font-700 text-(--theme-text) opacity-65">
                Todavia no se registro ningun motivo.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {registeredReasons.map((reason) => (
                <RegisteredReasonCard key={reason.id} reason={reason} />
              ))}
            </div>
          )}
        </section>
      </div>

      {!loading && ordersAwaitingReason.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-3 shadow-2xl md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-800 text-(--theme-text)">
                {ordersAwaitingReason.length} pendiente{ordersAwaitingReason.length === 1 ? '' : 's'}
              </p>
              <p className="truncate text-xs text-(--theme-text) opacity-55">
                Selecciona un pedido rechazado para registrar el motivo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

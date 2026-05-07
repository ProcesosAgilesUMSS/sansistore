import { useState } from 'react';
import type { DeliveryOrder, OrderStatus } from '../types';
import { useMessengerOrders } from '../hooks/useMessengerOrders';

type MessengerOrdersPanelProps = {
  initialMessengerId: string;
};

const messengerOptions = [
  { id: 'juan.mensajero', label: 'Juan', note: 'Con pedidos asignados' },
  { id: 'lucas.mensajero', label: 'Lucas', note: 'Con un pedido asignado' },
  { id: 'empty.mensajero', label: 'Sin pedidos', note: 'Prueba de estado vacio' },
  { id: 'error.mensajero', label: 'Forzar error', note: 'Prueba de estado error' },
];

const statusCopy: Record<OrderStatus, { label: string; tone: string }> = {
  READY_FOR_DELIVERY: {
    label: 'Listo para entrega',
    tone: 'bg-amber-500/12 text-amber-600',
  },
  ASSIGNED: {
    label: 'Asignado',
    tone: 'bg-sky-500/12 text-sky-600',
  },
  ACCEPTED: {
    label: 'Aceptado',
    tone: 'bg-emerald-500/12 text-emerald-600',
  },
  PENDING_REASSIGNMENT: {
    label: 'Pendiente de reasignacion',
    tone: 'bg-rose-500/12 text-rose-600',
  },
  IN_TRANSIT: {
    label: 'En camino',
    tone: 'bg-violet-500/12 text-violet-600',
  },
  DELIVERED: {
    label: 'Entregado',
    tone: 'bg-primary/15 text-primary',
  },
  CANCELLED: {
    label: 'Cancelado',
    tone: 'bg-slate-500/12 text-slate-500',
  },
};

function formatEventTime(date: Date | null | undefined) {
  if (!date) {
    return 'Pendiente';
  }

  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[140px] rounded-[20px] border border-border-light bg-card-bg-light px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-light/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-text-light">
        {value}
      </p>
    </div>
  );
}

type OrderCardProps = {
  order: DeliveryOrder;
  isProcessing: boolean;
  hasBusySibling: boolean;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
};

function OrderCard({
  order,
  isProcessing,
  hasBusySibling,
  onAccept,
  onReject,
}: OrderCardProps) {
  const status = statusCopy[order.status];
  const canAccept = order.status === 'ASSIGNED' && !isProcessing;
  const canReject = order.status === 'ASSIGNED' && !isProcessing;
  const isBlockedByOtherAction = hasBusySibling && !isProcessing;
  const actionHint =
    order.status === 'ASSIGNED'
      ? isBlockedByOtherAction
        ? 'Espera a que termine la operacion en otro pedido.'
        : 'Puedes aceptar o rechazar este pedido.'
      : order.status === 'ACCEPTED'
        ? 'Este pedido ya fue aceptado y ya no debe volver a decidirse.'
        : order.status === 'PENDING_REASSIGNMENT'
          ? 'Este pedido fue rechazado y queda pendiente de reasignacion.'
          : 'Este pedido ya no se puede operar desde esta vista.';
  const eventTime =
    order.status === 'ACCEPTED'
      ? formatEventTime(order.acceptedAt)
      : order.status === 'PENDING_REASSIGNMENT'
        ? formatEventTime(order.rejectedAt)
        : formatEventTime(order.assignedAt);
  const eventLabel =
    order.status === 'ACCEPTED'
      ? 'Aceptado'
      : order.status === 'PENDING_REASSIGNMENT'
        ? 'Rechazado'
        : 'Asignado';

  return (
    <article className="flex flex-col gap-5 rounded-[28px] border border-border-light bg-card-bg-light p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">
            Pedido {order.id}
          </p>
          <h2 className="text-lg font-black tracking-tight text-text-light">
            {order.buyerName}
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${status.tone}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-secondary-bg-light px-3 py-1 text-[11px] font-bold text-text-light/70">
          {eventLabel}: {eventTime}
        </span>
        <span className="rounded-full bg-secondary-bg-light px-3 py-1 text-[11px] font-bold text-text-light/70">
          Mensajero: {order.assignedMessengerName ?? 'Sin asignar'}
        </span>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-secondary-bg-light px-4 py-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-text-light/45">
            Cliente
          </dt>
          <dd className="mt-1 text-sm font-semibold text-text-light">
            {order.buyerName}
          </dd>
        </div>
        <div className="rounded-2xl bg-secondary-bg-light px-4 py-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-text-light/45">
            Mensajero
          </dt>
          <dd className="mt-1 text-sm font-semibold text-text-light">
            {order.assignedMessengerName ?? 'Sin asignar'}
          </dd>
        </div>
        <div className="rounded-2xl bg-secondary-bg-light px-4 py-3 sm:col-span-2">
          <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-text-light/45">
            Ubicacion de entrega
          </dt>
          <dd className="mt-1 text-sm font-semibold text-text-light">
            {order.deliveryLocationLabel}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onAccept(order.id)}
          disabled={!canAccept || isBlockedByOtherAction}
          className={`min-w-[140px] rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-opacity ${
            canAccept && !isBlockedByOtherAction
              ? 'bg-primary text-bg-dark'
              : 'bg-primary text-bg-dark opacity-50'
          }`}
        >
          {isProcessing ? 'Aceptando...' : 'Aceptar'}
        </button>
        <button
          type="button"
          onClick={() => onReject(order.id)}
          disabled={!canReject || isBlockedByOtherAction}
          className={`min-w-[140px] rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-opacity ${
            canReject && !isBlockedByOtherAction
              ? 'border-rose-500/50 text-rose-500'
              : 'border-rose-500/30 text-rose-500 opacity-50'
          }`}
        >
          {isProcessing ? 'Procesando...' : 'Rechazar'}
        </button>
      </div>

      <p className="text-xs font-medium text-text-light/55">{actionHint}</p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-border-light bg-card-bg-light px-6 py-14 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60">
        Sin pedidos
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-text-light">
        No tienes pedidos asignados por ahora
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-text-light/65">
        Cuando un vendedor te asigne pedidos para entrega, apareceran aqui con
        su estado, cliente y ubicacion de destino.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 grid gap-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[24px] border border-border-light bg-card-bg-light p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-28 rounded-full bg-secondary-bg-light" />
              <div className="h-6 w-44 rounded-full bg-secondary-bg-light" />
            </div>
            <div className="h-8 w-28 rounded-full bg-secondary-bg-light" />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="h-18 rounded-2xl bg-secondary-bg-light" />
            <div className="h-18 rounded-2xl bg-secondary-bg-light" />
            <div className="h-18 rounded-2xl bg-secondary-bg-light sm:col-span-2" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="h-11 w-36 rounded-full bg-secondary-bg-light" />
            <div className="h-11 w-36 rounded-full bg-secondary-bg-light" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-[28px] border border-rose-500/20 bg-rose-500/8 px-6 py-10 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500">
        Error de carga
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-text-light">
        No se pudieron obtener tus pedidos
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-text-light/65">{message}</p>
    </div>
  );
}

export default function MessengerOrdersPanel({
  initialMessengerId,
}: MessengerOrdersPanelProps) {
  const [messengerId, setMessengerId] = useState(initialMessengerId);
  const {
    orders,
    loading,
    error,
    activeOrderId,
    acceptOrder,
    rejectOrder,
    refreshOrders,
  } =
    useMessengerOrders(messengerId);
  const assignedCount = orders.filter((order) => order.status === 'ASSIGNED').length;
  const acceptedCount = orders.filter((order) => order.status === 'ACCEPTED').length;
  const pendingReassignCount = orders.filter(
    (order) => order.status === 'PENDING_REASSIGNMENT',
  ).length;
  const activeMessengerLabel =
    messengerOptions.find((option) => option.id === messengerId)?.label ?? messengerId;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-24 sm:px-6">
      <div className="overflow-hidden rounded-[32px] border border-border-light bg-[linear-gradient(135deg,rgba(136,176,75,0.14),rgba(136,176,75,0.03))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-primary/70">
              Team 2 Logistics
            </p>
            <h1 className="text-3xl font-black tracking-tight text-text-light sm:text-4xl">
              Gestion de pedidos asignados
            </h1>
            <p className="max-w-2xl text-sm text-text-light/68 sm:text-base">
              Vista operativa para que el mensajero revise su carga actual,
              identifique pedidos pendientes y responda cada asignacion sin
              salir del panel.
            </p>
          </div>

          <div className="rounded-[24px] border border-border-light bg-card-bg-light/80 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-light/45">
              Mensajero activo
            </p>
            <p className="mt-2 text-xl font-black tracking-tight text-text-light">
              {activeMessengerLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <SummaryPill label="Asignados" value={assignedCount} />
          <SummaryPill label="Aceptados" value={acceptedCount} />
          <SummaryPill label="Reasignar" value={pendingReassignCount} />
        </div>
      </div>

      <div className="rounded-[28px] border border-border-light bg-card-bg-light p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <div className="space-y-3 border-b border-border-light pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-light/45">
                Identidad temporal de desarrollo
              </p>
              <p className="text-sm text-text-light/60">
                Cambia de mensajero para probar visibilidad, vacio y error sin
                depender todavia del login real.
              </p>
            </div>

            <label className="flex w-full max-w-sm flex-col gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-text-light/45">
                Seleccionar mensajero
              </span>
              <select
                value={messengerId}
                onChange={(event) => setMessengerId(event.target.value)}
                className="rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-semibold text-text-light outline-none transition-colors focus:border-primary"
              >
                {messengerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} - {option.note}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm font-semibold text-text-light/70">
            Mensajero activo: <span className="text-text-light">{messengerId}</span>
          </p>
          {loading && (
            <p className="text-sm text-text-light/60">
              Cargando pedidos asignados desde la fuente temporal del flujo...
            </p>
          )}
          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          {!loading && !error && (
            <p className="text-sm text-text-light/60">
              Revisa tus pedidos pendientes y responde a cada asignacion desde
              este panel.
            </p>
          )}
        </div>

        {loading && <LoadingState />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-light/45">
                  Resumen
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-text-light">
                  {orders.length} pedidos asignados
                </h2>
              </div>
              <p className="text-sm text-text-light/60">
                Datos temporales compatibles con el flujo real de la HU.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary-bg-light px-4 py-3">
              <p className="text-sm text-text-light/65">
                Si cambias de mensajero o una accion tarda en responder, la
                vista refresca el estado mas reciente del panel.
              </p>
              <button
                type="button"
                onClick={() => void refreshOrders()}
                disabled={loading || activeOrderId !== null}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                  loading || activeOrderId !== null
                    ? 'bg-primary/30 text-bg-dark/70'
                    : 'bg-primary text-bg-dark'
                }`}
              >
                Refrescar
              </button>
            </div>

            {orders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isProcessing={activeOrderId === order.id}
                    hasBusySibling={activeOrderId !== null}
                    onAccept={acceptOrder}
                    onReject={rejectOrder}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

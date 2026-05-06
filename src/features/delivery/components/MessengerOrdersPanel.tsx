import type { DeliveryOrder, OrderStatus } from '../types';
import { useMessengerOrders } from '../hooks/useMessengerOrders';

type MessengerOrdersPanelProps = {
  messengerId: string;
};

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

function OrderCard({ order }: { order: DeliveryOrder }) {
  const status = statusCopy[order.status];

  return (
    <article className="flex flex-col gap-5 rounded-[24px] border border-border-light bg-card-bg-light p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1">
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
          disabled
          className="min-w-[140px] rounded-full bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-bg-dark opacity-50"
        >
          Aceptar
        </button>
        <button
          type="button"
          disabled
          className="min-w-[140px] rounded-full border border-rose-500/30 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-rose-500 opacity-50"
        >
          Rechazar
        </button>
      </div>
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

export default function MessengerOrdersPanel({
  messengerId,
}: MessengerOrdersPanelProps) {
  const { orders, loading, error } = useMessengerOrders(messengerId);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-24 sm:px-6">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-primary/70">
          Team 2 Logistics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-text-light sm:text-4xl">
          Pedidos asignados
        </h1>
      </div>

      <div className="rounded-[28px] border border-border-light bg-card-bg-light p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <div className="space-y-3 border-b border-border-light pb-5">
          <p className="text-sm font-semibold text-text-light/70">
            Mensajero activo: <span className="text-text-light">{messengerId}</span>
          </p>
          {loading && (
            <p className="text-sm text-text-light/60">
              Preparando el panel de entregas...
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
            </div>

            {orders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

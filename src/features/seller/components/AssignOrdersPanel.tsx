import { useAssignOrders } from '../hooks/useAssignOrders';
import { AssignOrderCard } from './AssignOrderCard';
import { SectionHeader } from './SectionHeader';

export default function AssignOrdersPanel() {
  const {
    ready,
    assigned,
    messengers,
    loading,
    messengersLoading,
    error,
    selectedCourier,
    selectCourier,
    assigningOrderId,
    assignOrder,
    unassignOrder,
  } = useAssignOrders();

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
    <div className="min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10">
      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <p
          className="mb-3 text-xs font-800 uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Panel del vendedor
        </p>

        <h1
          className="text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Asignar mensajeros
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Selecciona un mensajero para cada pedido listo para entrega.
        </p>
      </header>

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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
          <SectionHeader title="Por asignar" count={ready.length} />

          {loading ? skeletons : ready.length === 0
            ? emptyState('No hay pedidos pendientes de asignar.')
            : (
              <div className="flex flex-col gap-4">
                {ready.map((order) => (
                  <AssignOrderCard
                    key={order.orderId}
                    order={order}
                    messengers={messengers}
                    messengersLoading={messengersLoading}
                    selectedCourierId={selectedCourier[order.orderId]}
                    onSelectCourier={selectCourier}
                    onAssign={assignOrder}
                    isAssigning={assigningOrderId === order.orderId}
                    isSuccess={false}
                  />
                ))}
              </div>
            )}
        </section>

        <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
          <SectionHeader title="Asignados" count={assigned.length} />

          {loading ? skeletons : assigned.length === 0
            ? emptyState('Aún no has asignado ningún pedido.')
            : (
              <div className="flex flex-col gap-4">
                {assigned.map((order) => (
                  <AssignOrderCard
                    key={order.orderId}
                    order={order}
                    messengers={messengers}
                    messengersLoading={messengersLoading}
                    selectedCourierId={selectedCourier[order.orderId]}
                    onSelectCourier={selectCourier}
                    onAssign={assignOrder}
                    onUnassign={unassignOrder}
                    isAssigning={assigningOrderId === order.orderId}
                    isSuccess={true}
                  />
                ))}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

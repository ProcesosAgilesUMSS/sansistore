import { useMessengerOrders } from '../hooks/useMessengerOrders';

type MessengerOrdersPanelProps = {
  messengerId: string;
};

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
        <p className="max-w-2xl text-sm text-text-light/70">
          Panel base de la HU #104 para que el mensajero gestione pedidos
          asignados y responda a la solicitud de entrega.
        </p>
      </div>

      <div className="rounded-[28px] border border-border-light bg-card-bg-light p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <div className="space-y-3">
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
              La base del feature está lista. Pedidos cargados: {orders.length}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

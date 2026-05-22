import type { ReactNode } from 'react';
import { ClipboardList, DollarSign, ReceiptText } from 'lucide-react';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-800 uppercase tracking-[0.16em] text-primary">
      <span className="h-2 w-2 rounded-full bg-primary" />
      {label}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--theme-secondary-bg) text-(--theme-text)">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
            {title}
          </p>
          <p
            className="mt-2 text-3xl font-900 leading-tight text-(--theme-text)"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {value}
          </p>
          <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderHistoryPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { orders, loading, error, totalCollected } = useOrderHistory();

  return (
    <div
      className={
        embedded
          ? 'min-w-0'
          : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'
      }
    >
      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <h1
          className="text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Historial de pedidos
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Consulta los pedidos pagados del vendedor y revisa el detalle de cada cobro para seguimiento y auditoria.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <SummaryCard
          title="Pedidos pagados"
          value={loading ? '...' : String(orders.length)}
          subtitle="Pedidos cerrados y cobrados del vendedor."
          icon={<ReceiptText size={21} />}
        />
        <SummaryCard
          title="Total cobrado"
          value={loading ? '...' : formatCurrency(totalCollected)}
          subtitle="Suma total del historial mostrado."
          icon={<DollarSign size={21} />}
        />
        <SummaryCard
          title="Auditoria"
          value={loading ? '...' : 'Activa'}
          subtitle="Consulta por pedido con comprador, ubicacion y monto."
          icon={<ClipboardList size={21} />}
        />
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-(--theme-border) px-5 py-4">
          <div>
            <h2 className="text-xl font-900 tracking-[0.12em] text-(--theme-text)">
              Pedidos pagados
            </h2>
            <p className="mt-1 text-sm font-600 text-(--theme-text) opacity-60">
              Historial de pedidos pagados por pedido.
            </p>
          </div>
          <span className="rounded-full border border-(--theme-border) px-4 py-2 text-sm font-800 text-(--theme-text)">
            {loading ? '...' : orders.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-(--theme-secondary-bg)"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
            <p className="text-sm text-(--theme-text) opacity-50">
              Aun no hay pedidos pagados en el historial.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.orderId}
                className="rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/35 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-900 text-(--theme-text)">
                      {order.orderId}
                    </p>
                    <p className="mt-1 text-sm font-700 text-(--theme-text) opacity-75">
                      {order.buyerName ?? 'Comprador desconocido'}
                    </p>
                    <p className="mt-1 text-xs text-(--theme-text) opacity-55">
                      {order.locationLabel ?? 'Ubicacion desconocida'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={order.status} />
                    <StatusBadge label={order.paymentStatus || 'COBRADO'} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-(--theme-text) opacity-75 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-800 uppercase tracking-[0.18em] opacity-55">
                      Total
                    </p>
                    <p className="mt-1 text-base font-800 text-primary">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-800 uppercase tracking-[0.18em] opacity-55">
                      Estado de entrega
                    </p>
                    <p className="mt-1 font-700">
                      {order.deliveryStatus ?? 'Sin estado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-800 uppercase tracking-[0.18em] opacity-55">
                      Ultima actualizacion
                    </p>
                    <p className="mt-1 font-700">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useState } from 'react';
import { AlertTriangle, TrendingDown, Users, Banknote } from 'lucide-react';
import { useGetOrders } from '../hooks/useGetOrders';
import type { Order } from '../types';
import { Header } from './Header';
import { ErrorMessage } from './ErrorMessage';
import { EmptyOrders } from './EmptyOrders';
import { OrderDetailsModal } from './OrderDetailsModal';
import { SkeletonRows } from './SkeletonRows';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';
import { parseOrderId } from '@/features/cart/services/orderService';

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-800 uppercase tracking-[0.16em] text-(--theme-text) opacity-45">
          {label}
        </p>
        <p className="truncate font-display text-lg font-900 text-(--theme-text)">
          {value}
        </p>
      </div>
    </div>
  );
}

function IncidentRow({
  order,
  onViewDetails,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 transition hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-display text-lg font-800 text-(--theme-text)">
            {parseOrderId(order.orderId).friendlyName}
          </p>
          <p className="text-sm text-(--theme-text) opacity-55">
            {order.buyerName ?? 'Comprador desconocido'}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {order.incidentReason ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--theme-warning-border) bg-(--theme-warning-bg) px-3 py-1 text-sm font-800 text-(--theme-warning)">
              <AlertTriangle size={12} />
              {order.incidentReason}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-1 text-sm font-700 text-(--theme-text) opacity-50">
              Sin motivo
            </span>
          )}
          <span className="text-xs text-(--theme-text) opacity-40">
            {order.locationLabel ?? 'Sin ubicación'} · {formatDate(order.updatedAt)}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-900 text-primary">{formatCurrency(order.total)}</p>
      </div>

      <button
        type="button"
        onClick={() => onViewDetails(order)}
        className="shrink-0 rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary"
      >
        Ver detalles
      </button>
    </div>
  );
}

export default function IncidentsPanel({ embedded = false }: { embedded?: boolean }) {
  const { orders, loading, error } = useGetOrders({ status: 'NO ENTREGADO', ordby: 'desc' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueBuyers = new Set(orders.map((o) => o.buyerId)).size;

  const reasonCounts: Record<string, number> = {};
  for (const order of orders) {
    const r = order.incidentReason ?? 'Sin motivo';
    reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  }
  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const topReason = sortedReasons[0]?.[0] ?? '—';

  return (
    <div
      className={
        embedded
          ? 'mx-auto w-full max-w-7xl px-4 py-10'
          : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'
      }
    >
      <Header
        title="Incidencias"
        description="Resumen de pedidos no entregados para apoyar tus decisiones operativas."
      />

      {error && <ErrorMessage message={error} />}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {loading ? (
        <SkeletonRows count={3} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 divide-x divide-y divide-(--theme-border) overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-card-bg)">
            <div className="px-6 py-5"><StatItem icon={AlertTriangle} label="Total incidencias" value={orders.length} /></div>
            <div className="px-6 py-5"><StatItem icon={Banknote} label="Monto en riesgo" value={formatCurrency(totalAmount)} /></div>
            <div className="px-6 py-5"><StatItem icon={TrendingDown} label="Motivo frecuente" value={topReason} /></div>
            <div className="px-6 py-5"><StatItem icon={Users} label="Compradores afectados" value={uniqueBuyers} /></div>
          </div>

          {sortedReasons.length > 1 && (
            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5">
              <p className="mb-3 text-xs font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-45">
                Motivos
              </p>
              <div className="flex flex-wrap gap-2">
                {sortedReasons.map(([reason, count]) => (
                  <span
                    key={reason}
                    className="inline-flex items-center gap-2 rounded-full border border-(--theme-warning-border) bg-(--theme-warning-bg) px-4 py-1.5 text-sm font-700 text-(--theme-warning)"
                  >
                    {reason}
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--theme-warning-border) text-xs font-900 text-(--theme-warning)">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-900 text-primary-action">
                {orders.length}
              </span>
              <p className="font-display text-lg font-800 text-(--theme-text)">
                Pedidos no entregados
              </p>
            </div>

            {orders.length === 0 ? (
              <EmptyOrders description="No hay incidencias activas en este momento." />
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <IncidentRow
                    key={order.orderId}
                    order={order}
                    onViewDetails={setSelectedOrder}
                  />
                ))}
              </div>
            )}
          </div>

          {orders.length > 0 && (
            <div className="rounded-2xl border border-(--theme-warning-border) bg-(--theme-warning-bg) px-4 py-3">
              <p className="text-xs font-700 text-(--theme-warning)">
                Gestiona estos pedidos desde{' '}
                <a href="/seller/undelivered-orders" className="underline underline-offset-2 hover:opacity-80">
                  Pedidos no entregados
                </a>{' '}
                para reiniciarlos o cancelarlos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

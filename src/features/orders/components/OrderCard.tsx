import { Package, Calendar, MapPin, ChevronRight, RotateCcw } from 'lucide-react';
import type { Order } from '../types';
import { parseOrderId } from '../../cart/services/orderService';

interface OrderCardProps {
  order: Order;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'COMPLETADO':
    case 'PAGADO':
      return 'bg-[#88B04B]/10 text-[#4f7f24] border-[#88B04B]/20';
    case 'ENTREGADO':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'EN CAMINO':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'RESERVADO':
    case 'PENDIENTE':
    case 'EMPAQUETADO':
    case 'LISTO':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'CANCELADO':
    case 'NO ENTREGADO':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'CREADO':
      return 'bg-sky-500/10 text-sky-700 border-sky-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    CREADO: 'Creado',
    ASIGNADO: 'Asignado',
    'EN CAMINO': 'En camino',
    ENTREGADO: 'Entregado',
    PAGADO: 'Pagado',
    CANCELADO: 'Cancelado',
    'NO ENTREGADO': 'No entregado',
    RESERVADO: 'Reservado',
    PENDIENTE: 'Pendiente',
    EMPAQUETADO: 'Empaquetado',
    LISTO: 'Listo',
    COMPLETADO: 'Completado',
  };
  return labels[status] || status;
};

function isWithinReturnWindow(order: Order): boolean {
  const referenceDate = order.buyerReceptionConfirmedAt
    ? order.buyerReceptionConfirmedAt.toDate()
    : order.createdAt.toDate();
  const daysSince = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 7;
}

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = order.createdAt.toDate().toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const { uuid, friendlyName } = parseOrderId(order.id);

  const isDelivered = order.status === 'ENTREGADO' || order.status === 'COMPLETADO';
  const withinWindow = isDelivered && isWithinReturnWindow(order);

  return (
    <a
      href={`/mis-pedidos/${order.id}`}
      className="group bg-(--theme-card-bg) border border-(--theme-border) p-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package size={22} />
        </div>

        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold opacity-40 truncate max-w-[200px]">
                {uuid}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusStyles(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <span className="font-display font-extrabold text-base mt-0.5">
              {friendlyName}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1 text-sm opacity-80">
            <span className="flex items-center gap-1.5 text-xs">
              <Calendar size={14} /> {formattedDate}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-xs">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-[400px]">
                {order.address}
              </span>
            </span>
          </div>

          <span className="text-xs mt-1 font-medium opacity-60">
            {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}
          </span>

          {isDelivered && (
            <div className="mt-2">
              {withinWindow ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <RotateCcw size={12} /> Devolución disponible
                </span>
              ) : (
                <span
                  title="Han pasado más de 7 días desde la entrega"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-help"
                >
                  <RotateCcw size={12} /> Plazo de devolución vencido
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-(--theme-border) sm:border-none pt-3 sm:pt-0">
        <div className="flex flex-col sm:text-right">
          <span className="text-[11px] uppercase tracking-wider opacity-50 font-bold">
            Total
          </span>
          <span className="text-lg font-display font-black text-primary">
            {(order.total ?? 0).toFixed(2)}{' '}
            <small className="text-xs font-normal">Bs.</small>
          </span>
        </div>
        <div className="text-primary p-2 rounded-full bg-primary/5 transition-transform group-hover:translate-x-0.5 sm:block">
          <ChevronRight size={18} />
        </div>
      </div>
    </a>
  );
}

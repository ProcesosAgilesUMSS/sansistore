import { Package, Calendar, MapPin, ChevronRight } from 'lucide-react';
import type { Order } from '../types';
import { parseOrderId } from '../../cart/services/orderService';

interface OrderCardProps {
  order: Order;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-[#88B04B]/10 text-[#88B04B]';
    case 'in_transit':
      return 'bg-blue-500/10 text-blue-500';
    case 'preparing':
      return 'bg-amber-500/10 text-amber-500';
    case 'cancelled':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    preparing: "Preparando",
    in_transit: "En camino",
    delivered: "Entregado",
    cancelled: "Cancelado"
  };
  return labels[status] || status;
};

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = order.createdAt.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const { uuid, friendlyName } = parseOrderId(order.id);
  return (
    <a
      href={`/mis-pedidos/${order.id}`}
      className="bg-(--theme-card-bg) border border-(--theme-border) p-5 rounded-[1.25rem] shadow-sm transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-(--theme-secondary-bg) text-(--theme-text) opacity-80">
          <Package size={22} />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold opacity-40 truncate max-w-[200px]">
                {uuid}
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyles(order.status)}`}>
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
            <span className="flex items-center gap-1.5 text-xs truncate max-w-[280px] sm:max-w-[400px]">
              <MapPin size={14} /> {order.address}
            </span>
          </div>

          <span className="text-xs mt-1 font-medium opacity-60">
            {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-(--theme-border) sm:border-none pt-3 sm:pt-0">
        <div className="flex flex-col sm:text-right">
          <span className="text-[11px] uppercase tracking-wider opacity-50 font-bold">Total</span>
          <span className="text-lg font-display font-black text-primary">
            {(order.total ?? 0).toFixed(2)} <small className="text-xs font-normal">Bs.</small>
          </span>
        </div>
        <div className="text-primary p-2 rounded-full bg-primary/5 sm:block">
          <ChevronRight size={18} />
        </div>
      </div>
    </a>
  );
}

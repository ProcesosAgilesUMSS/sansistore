import React from 'react';
import { ArrowLeft, MapPin, Package, Calendar, AlertCircle } from 'lucide-react';
import type { Order } from '../types';

interface OrderDetailsPanelProps {
  order: Order;
  onBack: () => void;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-[#88B04B]/10 text-[#88B04B] border-[#88B04B]/20';
    case 'in_transit': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'preparing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Pendiente", preparing: "Preparando",
    in_transit: "En camino", delivered: "Entregado", cancelled: "Cancelado"
  };
  return labels[status] || status;
};

export default function OrderDetailsPanel({ order, onBack }: OrderDetailsPanelProps) {
  const formattedDate = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('es-BO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' 
      })
    : 'Fecha no disponible';
  const canRequestReturn = order.status === 'delivered';
  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-[1.25rem] p-6 shadow-sm flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--theme-border) pb-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-(--theme-secondary-bg) rounded-full transition-colors opacity-70 hover:opacity-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-display font-extrabold text-xl tracking-tight">
              Pedido #{order.id.substring(0,8).toUpperCase()}
            </h2>
            <p className="text-xs opacity-60 flex items-center gap-1 mt-1">
              <Calendar size={12} /> {formattedDate}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusStyles(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="bg-(--theme-secondary-bg) p-4 rounded-xl flex items-start gap-3">
        <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
        <div>
          <h4 className="text-sm font-bold mb-1">Ubicación de entrega</h4>
          <p className="text-sm opacity-80">{order.delivery.destination}</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Package size={18} /> Productos comprados
        </h3>
        <div className="flex flex-col gap-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-(--theme-border) last:border-0 opacity-90">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.productName}</span>
                <span className="text-xs opacity-60">{item.quantity} x {item.unitPrice?.toFixed(2)} Bs.</span>
              </div>
              <span className="text-sm font-bold">{item.subtotal?.toFixed(2)} Bs.</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-(--theme-border) pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {canRequestReturn ? (
          <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-full border border-(--theme-text) text-sm font-bold transition-all hover:bg-(--theme-text) hover:text-(--theme-bg) active:scale-95">
            <AlertCircle size={16} /> Solicitar Devolución
          </button>
        ) : (
          <p className="text-xs opacity-50 italic">Las devoluciones solo están disponibles para pedidos entregados.</p>
        )}

        <div className="text-right w-full sm:w-auto">
          <span className="text-xs uppercase tracking-wider opacity-60 font-bold mr-3">Total pagado</span>
          <span className="text-2xl font-display font-black text-primary">
            {order.total?.toFixed(2)} <small className="text-sm font-normal">Bs.</small>
          </span>
        </div>
      </div>

    </div>
  );
}

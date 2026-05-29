import { useState } from 'react';
import { ArrowLeft, MapPin, Package, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import type { Order } from '../types';
import { confirmOrderReception, createReturnRequest } from '../services/ordersService';
import { Timestamp } from 'firebase/firestore';
import { parseOrderId } from '../../cart/services/orderService';

interface OrderDetailsPanelProps {
  order: Order;
  onBack: () => void;
  onOrderConfirmed?: (order: Order) => void;
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

function formatDateTime(value: Order['buyerReceptionConfirmedAt']) {
  if (!value) return null;
  return value.toDate().toLocaleString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailsPanel({ order, onBack, onOrderConfirmed }: OrderDetailsPanelProps) {
  const { uuid, friendlyName } = parseOrderId(order.id);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showReceptionConfirm, setShowReceptionConfirm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingReception, setIsConfirmingReception] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const orderDate = order.createdAt.toDate();
  const formattedDate = orderDate.toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  const isWithinTimeLimit = hoursSinceOrder <= 72;
  const canRequestReturn = order.status === 'delivered' && isWithinTimeLimit;
  const receptionConfirmedAt = formatDateTime(order.buyerReceptionConfirmedAt);
  const canConfirmReception = order.status === 'delivered' && !order.buyerReceptionConfirmed;

  const handleConfirmReception = async () => {
    if (!order.buyerId || order.buyerReceptionConfirmed) return;

    setIsConfirmingReception(true);
    setReceptionError(null);

    try {
      await confirmOrderReception(order.id, order.buyerId);
      const updatedOrder = {
        ...order,
        status: 'delivered' as const,
        buyerReceptionConfirmed: true,
        buyerReceptionConfirmedAt: Timestamp.fromDate(new Date()),
      };
      onOrderConfirmed?.(updatedOrder);
      setShowReceptionConfirm(false);
    } catch (error) {
      setReceptionError(
        error instanceof Error
          ? error.message
          : 'No se pudo confirmar la recepción del pedido.'
      );
    } finally {
      setIsConfirmingReception(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedProductId || !returnReason.trim()) return;
    setIsSubmitting(true);
    try {
      const productToReturn = order.items.find(item => item.productId === selectedProductId);
      await createReturnRequest({
        orderId: order.id,
        buyerId: order.buyerId,
        productId: selectedProductId,
        productName: productToReturn?.productName || 'Producto desconocido',
        reason: returnReason
      });
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="text-[10px] font-mono text-text-light/40">{uuid}</p>
            <h2 className="font-display font-extrabold text-xl tracking-tight">
              {friendlyName}
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

      <div className="bg-(--theme-secondary-bg) p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold mb-1">Ubicación de entrega</h4>
            <p className="text-sm opacity-80">{order.delivery.destination}</p>
          </div>
        </div>
        {order.secret && (
          <div className="flex items-start gap-3 pt-3 border-t border-(--theme-border)">
            <div className="flex items-center justify-center w-5 h-5 mt-0.5 shrink-0 rounded-full bg-primary/10 text-primary font-bold text-xs">
              <span>#</span>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-1">Código de seguridad</h4>
              <p className="text-lg font-mono font-black tracking-widest text-primary">{order.secret}</p>
            </div>
          </div>
        )}
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

      <div className="border-t border-(--theme-border) pt-4">
        <div className="mb-4 rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold">Recepción del pedido</h4>
              <p className="mt-1 text-xs opacity-70">
                {order.buyerReceptionConfirmed
                  ? `Confirmada${receptionConfirmedAt ? ` el ${receptionConfirmedAt}` : ''}.`
                  : order.status === 'delivered'
                    ? 'Valida que recibiste el pedido correctamente.'
                    : 'Disponible cuando el mensajero marque el pedido como entregado.'}
              </p>
              {receptionError && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {receptionError}
                </p>
              )}
            </div>

            {order.buyerReceptionConfirmed ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
                <CheckCircle size={15} /> Recepción confirmada
              </span>
            ) : canConfirmReception ? (
              <button
                type="button"
                onClick={() => {
                  setShowReceptionConfirm(true);
                  setReceptionError(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-(--theme-bg) transition-all hover:brightness-105 active:scale-95"
              >
                <CheckCircle size={16} /> Confirmar recepción
              </button>
            ) : (
              <span className="rounded-full border border-(--theme-border) px-4 py-2 text-xs font-bold uppercase tracking-wider opacity-55">
                Pendiente de entrega
              </span>
            )}
          </div>

          {showReceptionConfirm && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold">
                ¿Confirmas que recibiste este pedido en buen estado?
              </p>
              <p className="mt-1 text-xs opacity-70">
                Esta acción registrará la fecha y hora de confirmación y no podrá repetirse.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowReceptionConfirm(false)}
                  disabled={isConfirmingReception}
                  className="rounded-full border border-(--theme-border) px-4 py-2 text-sm font-bold transition hover:bg-(--theme-card-bg) disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReception}
                  disabled={isConfirmingReception}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-(--theme-bg) transition hover:brightness-105 disabled:opacity-50"
                >
                  {isConfirmingReception ? 'Confirmando...' : 'Sí, recibí el pedido'}
                </button>
              </div>
            </div>
          )}
        </div>

        {success ? (
          <div className="bg-green-500/10 text-green-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle size={24} />
            <span className="font-bold text-sm">¡Solicitud enviada con éxito!</span>
            <span className="text-xs opacity-80">El equipo la revisará en breve.</span>
          </div>
        ) : showReturnForm ? (
          <div className="bg-(--theme-secondary-bg) p-4 rounded-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
            <h4 className="font-bold text-sm">Detalles de la devolución</h4>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm"
            >
              <option value="">Selecciona el producto a devolver...</option>
              {order.items.map(item => (
                <option key={item.productId} value={item.productId}>{item.productName}</option>
              ))}
            </select>

            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Explica brevemente el motivo de la devolución..."
              className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm resize-none h-24"
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowReturnForm(false)}
                className="px-4 py-2 text-sm font-bold opacity-60 hover:opacity-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={!selectedProductId || !returnReason.trim() || isSubmitting}
                className="px-5 py-2 bg-primary text-(--theme-bg) rounded-full text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {canRequestReturn ? (
              <button
                onClick={() => setShowReturnForm(true)}
                className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-full border border-(--theme-text) text-sm font-bold transition-all hover:bg-(--theme-text) hover:text-(--theme-bg) active:scale-95"
              >
                <AlertCircle size={16} /> Solicitar Devolución
              </button>
            ) : (
              <p className="text-xs opacity-50 italic">
                {order.status !== 'delivered'
                  ? 'Las devoluciones solo están disponibles para pedidos entregados.'
                  : 'El plazo de 72 horas para devolver este pedido ha expirado.'}
              </p>
            )}

            <div className="text-right w-full sm:w-auto mt-4 sm:mt-0">
              <span className="text-xs uppercase tracking-wider opacity-60 font-bold mr-3">Total pagado</span>
              <span className="text-2xl font-display font-black text-primary">
                {order.total?.toFixed(2)} <small className="text-sm font-normal">Bs.</small>
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, MapPin, Package, Calendar, AlertCircle, CheckCircle, RotateCcw, Info } from 'lucide-react';
import type { Order } from '../types';
import type { ReturnReason, ReturnItem } from '../types';
import { RETURN_REASON_LABELS } from '../types';
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
    case 'ENTREGADO':
    case 'PAGADO':
    case 'COMPLETADO':
      return 'bg-[#88B04B]/10 text-[#88B04B] border-[#88B04B]/20';
    case 'EN CAMINO':
    case 'ASIGNADO':
    case 'LISTO':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'RESERVADO':
    case 'EMPAQUETADO':
    case 'PENDIENTE':
    case 'CREADO':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'CANCELADO':
    case 'NO ENTREGADO':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    CREADO: 'Creado',
    PENDIENTE: 'Pendiente',
    RESERVADO: 'Reservado',
    EMPAQUETADO: 'Empaquetado',
    LISTO: 'Listo',
    ASIGNADO: 'Asignado',
    'EN CAMINO': 'En camino',
    ENTREGADO: 'Entregado',
    PAGADO: 'Pagado',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
    'NO ENTREGADO': 'No entregado',
  };
  return labels[status] || status;
};

const isDeliveredOrder = (order: Order) =>
  order.status === 'ENTREGADO' ||
  order.deliveryStatus === 'DELIVERED' ||
  order.deliveryStatus === 'delivered';

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

/** Devuelve días restantes para devolver (negativo = vencido) */
function getReturnDaysLeft(order: Order): number {
  const referenceDate = order.buyerReceptionConfirmedAt
    ? order.buyerReceptionConfirmedAt.toDate()
    : order.createdAt.toDate();
  const daysSince = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  return 7 - daysSince;
}

export default function OrderDetailsPanel({ order, onBack, onOrderConfirmed }: OrderDetailsPanelProps) {
  const { uuid, friendlyName } = parseOrderId(order.id);

  // Reception confirm state
  const [showReceptionConfirm, setShowReceptionConfirm] = useState(false);
  const [isConfirmingReception, setIsConfirmingReception] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);

  // Return form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState<ReturnReason | ''>('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderDate = order.createdAt.toDate();
  const formattedDate = orderDate.toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const isDelivered = order.status === 'ENTREGADO' || order.status === 'COMPLETADO';
  const daysLeft = getReturnDaysLeft(order);
  const canRequestReturn = isDelivered && daysLeft > 0;
  const receptionConfirmedAt = formatDateTime(order.buyerReceptionConfirmedAt);
  const canConfirmReception = order.status === 'ENTREGADO' && !order.buyerReceptionConfirmed;

  // ── Reception confirm ──────────────────────────────────────────────────────

  const handleConfirmReception = async () => {
    if (!order.buyerId || order.buyerReceptionConfirmed) return;
    setIsConfirmingReception(true);
    setReceptionError(null);
    try {
      await confirmOrderReception(order.id, order.buyerId);
      const updatedOrder = {
        ...order,
        buyerReceptionConfirmed: true,
        buyerReceptionConfirmedAt: Timestamp.fromDate(new Date()),
      };
      onOrderConfirmed?.(updatedOrder);
      setShowReceptionConfirm(false);
    } catch (error) {
      setReceptionError(
        error instanceof Error ? error.message : 'No se pudo confirmar la recepción del pedido.'
      );
    } finally {
      setIsConfirmingReception(false);
    }
  };

  // ── Return form ────────────────────────────────────────────────────────────

  const handleItemQuantityChange = (productId: string, productName: string, maxQty: number, value: string) => {
    const qty = parseInt(value, 10);
    const newErrors = { ...quantityErrors };

    if (isNaN(qty) || qty < 0) {
      // remove item if cleared
      const next = { ...selectedItems };
      delete next[productId];
      setSelectedItems(next);
      delete newErrors[productId];
    } else if (qty > maxQty) {
      newErrors[productId] = `No puedes devolver más de ${maxQty} unidad(es) de este producto.`;
      setSelectedItems({ ...selectedItems, [productId]: qty });
    } else {
      delete newErrors[productId];
      if (qty === 0) {
        const next = { ...selectedItems };
        delete next[productId];
        setSelectedItems(next);
      } else {
        setSelectedItems({ ...selectedItems, [productId]: qty });
      }
    }
    setQuantityErrors(newErrors);
  };

  const selectedCount = Object.values(selectedItems).reduce((s, v) => s + v, 0);
  const hasQuantityErrors = Object.keys(quantityErrors).length > 0;
  const canSubmit = selectedCount > 0 && returnReason !== '' && !hasQuantityErrors && !isSubmitting;

  const handleSubmitReturn = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const items: ReturnItem[] = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const orderItem = order.items.find(i => i.productId === productId);
        return {
          productId,
          productName: orderItem?.productName ?? 'Producto desconocido',
          quantity,
        };
      });

    // Validate none exceeds ordered quantity
    for (const item of items) {
      const ordered = order.items.find(i => i.productId === item.productId);
      if (ordered && item.quantity > ordered.quantity) {
        setSubmitError(`No puedes devolver más productos de los que pediste (${ordered.productName}: máx. ${ordered.quantity}).`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const returnId = await createReturnRequest({
        orderId: order.id,
        buyerId: order.buyerId,
        items,
        reason: returnReason as ReturnReason,
        description: description.trim() || undefined,
      });
      setReturnSuccess(returnId);
    } catch (err) {
      console.error(err);
      setSubmitError('Hubo un error al enviar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReturnForm = () => {
    setShowReturnForm(false);
    setSelectedItems({});
    setReturnReason('');
    setDescription('');
    setQuantityErrors({});
    setSubmitError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-[1.25rem] p-6 shadow-sm flex flex-col gap-6">

      {/* Header */}
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

      {/* Delivery info */}
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
              <h4 className="text-sm font-bold mb-1">Código de confirmación</h4>
              <p className="text-lg font-mono font-black tracking-widest text-primary">{order.secret}</p>
            </div>
          </div>
        )}
      </div>

      {/* Products */}
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

      {/* Reception confirm + Return section */}
      <div className="border-t border-(--theme-border) pt-4 flex flex-col gap-4">

        {/* Reception */}
        <div className="mb-2 rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg)/60 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold">Recepción del pedido</h4>
              <p className="mt-1 text-xs opacity-70">
                {order.buyerReceptionConfirmed
                  ? `Confirmada${receptionConfirmedAt ? ` el ${receptionConfirmedAt}` : ''}.`
                  : order.status === 'ENTREGADO'
                    ? 'Valida que recibiste el pedido correctamente.'
                    : 'Disponible cuando el mensajero marque el pedido como entregado.'}
              </p>
              {receptionError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{receptionError}</p>
              )}
            </div>

            {order.buyerReceptionConfirmed ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
                <CheckCircle size={15} /> Recepción confirmada
              </span>
            ) : canConfirmReception ? (
              <button
                type="button"
                onClick={() => { setShowReceptionConfirm(true); setReceptionError(null); }}
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
              <p className="text-sm font-semibold">¿Confirmas que recibiste este pedido en buen estado?</p>
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

        {/* Return section */}
        {returnSuccess ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-5 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle size={28} />
            <span className="font-bold text-sm">Tu solicitud de devolución ha sido enviada.</span>
            <span className="text-xs opacity-80">Te contactaremos pronto.</span>
            <span className="font-mono text-xs opacity-60 mt-1">ID: #{returnSuccess.substring(0, 8).toUpperCase()}</span>
            <a
              href="/my-returns"
              className="mt-2 text-xs font-bold underline underline-offset-2 text-green-700 hover:text-green-800"
            >
              Ver mis devoluciones →
            </a>
          </div>
        ) : showReturnForm ? (
          <div className="bg-(--theme-secondary-bg) border border-(--theme-border) p-5 rounded-xl flex flex-col gap-5">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <RotateCcw size={16} /> Solicitar devolución
            </h4>

            {/* Product selection */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
                Productos a devolver
              </p>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => {
                  const qty = selectedItems[item.productId] ?? 0;
                  return (
                    <div
                      key={item.productId}
                      className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-colors ${qty > 0 ? 'border-primary/40 bg-primary/5' : 'border-(--theme-border) bg-(--theme-bg)'}`}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{item.productName}</span>
                        <span className="text-xs opacity-60">Comprado: {item.quantity} ud.</span>
                        {quantityErrors[item.productId] && (
                          <span className="text-xs text-red-500 mt-0.5">{quantityErrors[item.productId]}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs opacity-60 shrink-0">Cantidad:</label>
                        <input
                          id={`qty-${item.productId}`}
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) =>
                            handleItemQuantityChange(item.productId, item.productName, item.quantity, e.target.value)
                          }
                          className="w-16 text-center text-sm font-bold border border-(--theme-border) rounded-lg px-2 py-1 bg-(--theme-bg) focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedCount > 0 && (
                <p className="text-xs text-primary font-semibold mt-2">
                  {selectedCount} producto(s) seleccionado(s) para devolución.
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block" htmlFor="return-reason">
                Motivo de devolución <span className="text-red-500">*</span>
              </label>
              <select
                id="return-reason"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">Selecciona un motivo...</option>
                {(Object.entries(RETURN_REASON_LABELS) as [ReturnReason, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block" htmlFor="return-description">
                Descripción adicional <span className="opacity-50">(opcional)</span>
              </label>
              <textarea
                id="return-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema con más detalle..."
                className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm resize-none h-24 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-xs font-semibold">{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelReturnForm}
                className="px-4 py-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={!canSubmit}
                className="px-5 py-2 bg-primary text-(--theme-bg) rounded-full text-sm font-bold disabled:opacity-40 transition-all active:scale-95 hover:brightness-105"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {canRequestReturn ? (
              <button
                id="btn-solicitar-devolucion"
                onClick={() => setShowReturnForm(true)}
                className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-full border border-(--theme-text) text-sm font-bold transition-all hover:bg-(--theme-text) hover:text-(--theme-bg) active:scale-95"
              >
                <RotateCcw size={16} /> Solicitar Devolución
              </button>
            ) : isDelivered ? (
              <p className="text-xs opacity-50 italic flex items-center gap-1.5">
                <Info size={14} /> El plazo de 7 días para devolver este pedido ha expirado.
              </p>
            ) : order.items.length === 0 ? (
              <span
                title="No tienes pedidos elegibles para devolución"
                className="text-xs opacity-50 italic cursor-help flex items-center gap-1.5"
              >
                <Info size={14} /> Devolución no disponible para este pedido.
              </span>
            ) : (
              <p className="text-xs opacity-50 italic flex items-center gap-1.5">
                <Info size={14} /> Las devoluciones solo están disponibles para pedidos entregados.
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

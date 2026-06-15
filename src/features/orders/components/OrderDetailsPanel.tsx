import { useState } from 'react';
import {
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import type { Order } from '../types';
import type { ReturnReason, ReturnItem } from '../types';
import { RETURN_REASON_LABELS } from '../types';
import { confirmOrderReception, createReturnRequest } from '../services/ordersService';
import { Timestamp } from 'firebase/firestore';
import { parseOrderId } from '../../cart/services/orderService';
import DeliveryReviewStars from './DeliveryReviewStars';

interface OrderDetailsPanelProps {
  order: Order;
  onBack: () => void;
  onOrderConfirmed?: (order: Order) => void;
}

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl?: string;
  productName: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-(--theme-border) bg-(--theme-card-bg) text-primary">
      {(!imageUrl || failed || !loaded) && <Package size={20} />}
      {imageUrl && !failed && (
        <img
          src={imageUrl}
          alt={productName}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'CERRADO':
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
    CERRADO: 'Cerrado',
    COMPLETADO: 'Completado',
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

export default function OrderDetailsPanel({
  order,
  onBack,
  onOrderConfirmed,
}: OrderDetailsPanelProps) {
  const { uuid, friendlyName } = parseOrderId(order.id);

  const [showReceptionConfirm, setShowReceptionConfirm] = useState(false);
  const [isConfirmingReception, setIsConfirmingReception] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);

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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  const isWithinTimeLimit = hoursSinceOrder <= 72;
  const isDelivered =
    order.status === 'ENTREGADO' ||
    order.status === 'CERRADO' ||
    order.status === 'COMPLETADO' ||
    order.status === 'PAGADO' ||
    order.deliveryStatus === 'DELIVERED';
  const canRequestReturn = isDelivered && isWithinTimeLimit;
  const receptionConfirmedAt = formatDateTime(order.buyerReceptionConfirmedAt);
  const canConfirmReception = isDeliveredOrder(order) && !order.buyerReceptionConfirmed;

  const handleConfirmReception = async () => {
    if (!order.buyerId || order.buyerReceptionConfirmed) return;
    setIsConfirmingReception(true);
    setReceptionError(null);
    try {
      await confirmOrderReception(order.id, order.buyerId);
      const updatedOrder: Order = {
        ...order,
        status: 'CERRADO',
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

  const handleItemQuantityChange = (
    productId: string,
    maxQty: number,
    value: string
  ) => {
    const qty = parseInt(value, 10);
    const newErrors = { ...quantityErrors };

    if (isNaN(qty) || qty < 0) {
      const next = { ...selectedItems };
      delete next[productId];
      setSelectedItems(next);
      delete newErrors[productId];
    } else if (qty > maxQty) {
      newErrors[productId] = `No puedes devolver más de ${maxQty} unidad(es).`;
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
        const orderItem = order.items.find((i) => i.productId === productId);
        return {
          productId,
          productName: orderItem?.productName ?? 'Producto desconocido',
          quantity,
        };
      });

    for (const item of items) {
      const ordered = order.items.find((i) => i.productId === item.productId);
      if (ordered && item.quantity > ordered.quantity) {
        setSubmitError(
          `No puedes devolver más productos de los que pediste (${ordered.productName}: máx. ${ordered.quantity}).`
        );
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

  const cardClass =
    'bg-(--theme-card-bg) border border-(--theme-border) rounded-xl p-4 shadow-sm sm:p-5';

  return (
    <div className="w-full overflow-x-hidden">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <div className={`${cardClass} flex flex-col gap-3`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-40 truncate">
                  {uuid}
                </p>
                <h2 className="mt-1 font-display font-extrabold text-xl tracking-tight">
                  {friendlyName}
                </h2>
              </div>
              <span
                className={`shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusStyles(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs opacity-60 flex-wrap">
              <Calendar size={13} className="shrink-0" /> {formattedDate}
            </p>
          </div>

          <div className={`${cardClass} flex flex-col gap-4`}>
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
              <div className="min-w-0">
                <h4 className="text-sm font-bold mb-1">Ubicación de entrega</h4>
                <p className="text-sm opacity-80 break-words">{order.address}</p>
              </div>
            </div>
            {order.secret && (
              <div className="flex items-start gap-3 pt-4 border-t border-(--theme-border)">
                <div className="flex items-center justify-center w-6 h-6 mt-0.5 shrink-0 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  <span>#</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">Código de confirmación</h4>
                  <p className="text-xl font-mono font-black tracking-widest text-primary">
                    {order.secret}
                  </p>
                </div>
              </div>
            )}
            {order.status === 'CANCELADO' && (order.incidentNotes || order.incidentReason) && (
              <div className="flex items-start gap-3 pt-4 border-t border-(--theme-border)">
                <div className="flex items-center justify-center w-6 h-6 mt-0.5 shrink-0 rounded-full bg-red-500/10 text-red-500 font-bold text-xs">
                  <AlertCircle size={14} />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1 text-red-500">Motivo de cancelación</h4>
                  <p className="text-sm opacity-80 break-words">
                    {order.incidentNotes || order.incidentReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={cardClass}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Package size={18} /> Productos comprados
            </h3>
            <div className="flex flex-col gap-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg bg-(--theme-secondary-bg) px-3 py-3 overflow-hidden"
                >
                  <ProductThumbnail
                    imageUrl={item.imageUrl}
                    productName={item.productName}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.productName}</p>
                    <p className="text-xs opacity-60">
                      {item.quantity} x {item.unitPrice?.toFixed(2)} Bs.
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">
                    {item.subtotal?.toFixed(2)} Bs.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 min-w-0">
          <div className={`${cardClass} bg-(--theme-card-bg)`}>
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <CheckCircle size={18} /> Recepción del pedido
            </h3>
            <p className="text-sm opacity-70 mb-4">
              {order.buyerReceptionConfirmed
                ? `Confirmada${receptionConfirmedAt ? ` el ${receptionConfirmedAt}` : ''}.`
                : isDeliveredOrder(order)
                  ? 'Valida que recibiste el pedido correctamente.'
                  : 'Disponible cuando el mensajero marque el pedido como entregado.'}
            </p>
            {receptionError && (
              <p className="mb-3 text-sm font-semibold text-red-600">{receptionError}</p>
            )}

            {order.buyerReceptionConfirmed ? (
              <span className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
                <CheckCircle size={15} /> Recepción confirmada
              </span>
            ) : canConfirmReception ? (
              <button
                type="button"
                onClick={() => {
                  setShowReceptionConfirm(true);
                  setReceptionError(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-(--theme-bg) transition-all hover:brightness-105 active:scale-95"
              >
                <CheckCircle size={16} /> Confirmar recepción
              </button>
            ) : (
              <span className="flex w-full items-center justify-center rounded-full border border-(--theme-border) px-4 py-2 text-xs font-bold uppercase tracking-wider opacity-55">
                Pendiente de entrega
              </span>
            )}

            {showReceptionConfirm && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-semibold">
                  ¿Confirmas que recibiste este pedido en buen estado?
                </p>
                <p className="mt-1 text-xs opacity-70">
                  Esta acción registrará la fecha y hora de confirmación y no podrá repetirse.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmReception}
                    disabled={isConfirmingReception}
                    className="w-full rounded-full bg-primary px-5 py-2 text-sm font-bold text-(--theme-bg) transition hover:brightness-105 disabled:opacity-50"
                  >
                    {isConfirmingReception ? 'Confirmando...' : 'Sí, recibí el pedido'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReceptionConfirm(false)}
                    disabled={isConfirmingReception}
                    className="w-full rounded-full border border-(--theme-border) px-4 py-2 text-sm font-bold transition hover:bg-(--theme-card-bg) disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {order.buyerReceptionConfirmed && (
            <div className={cardClass}>
              <DeliveryReviewStars order={order} />
            </div>
          )}

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs uppercase tracking-wider opacity-60 font-bold">
                Total pagado
              </span>
              <span className="text-2xl font-display font-black text-primary">
                {order.total?.toFixed(2)}{' '}
                <small className="text-sm font-normal">Bs.</small>
              </span>
            </div>

            {returnSuccess ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex flex-col items-center gap-2 text-center">
                <CheckCircle size={24} />
                <span className="font-bold text-sm">Tu solicitud ha sido enviada.</span>
                <span className="text-xs opacity-80">Te contactaremos pronto.</span>
                <span className="font-mono text-xs opacity-60 mt-1">
                  ID: #{returnSuccess.substring(0, 8).toUpperCase()}
                </span>
              </div>
            ) : showReturnForm ? (
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <RotateCcw size={16} /> Solicitar devolución
                </h4>

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
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${qty > 0 ? 'border-primary/40 bg-primary/5' : 'border-(--theme-border) bg-(--theme-bg)'}`}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{item.productName}</span>
                            <span className="text-xs opacity-60">Comprado: {item.quantity} ud.</span>
                            {quantityErrors[item.productId] && (
                              <span className="text-xs text-red-500 mt-0.5">
                                {quantityErrors[item.productId]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-xs opacity-60">Cant.:</label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={qty === 0 ? '' : qty}
                              placeholder="0"
                              onChange={(e) =>
                                handleItemQuantityChange(item.productId, item.quantity, e.target.value)
                              }
                              className="w-14 text-center text-sm font-bold border border-(--theme-border) rounded-lg px-2 py-1 bg-(--theme-bg) focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedCount > 0 && (
                    <p className="text-xs text-primary font-semibold mt-2">
                      {selectedCount} producto(s) seleccionado(s).
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">
                    Motivo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                    className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm"
                  >
                    <option value="">Selecciona un motivo...</option>
                    {(Object.entries(RETURN_REASON_LABELS) as [ReturnReason, string][]).map(
                      ([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">
                    Descripción <span className="opacity-50">(opcional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el problema con más detalle..."
                    className="w-full p-2.5 rounded-lg border border-(--theme-border) bg-(--theme-bg) text-sm resize-none h-20"
                  />
                </div>

                {submitError && (
                  <div className="flex items-start gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span className="text-xs font-semibold">{submitError}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmitReturn}
                  disabled={!canSubmit}
                  className="w-full px-5 py-2.5 bg-primary text-(--theme-bg) rounded-full text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar Devolución'}
                </button>
                <button
                  onClick={handleCancelReturnForm}
                  className="w-full px-4 py-2 text-sm font-bold opacity-60 hover:opacity-100 rounded-full border border-(--theme-border)"
                >
                  Cancelar
                </button>
              </div>
            ) : canRequestReturn ? (
              <button
                onClick={() => setShowReturnForm(true)}
                className="w-full flex justify-center items-center gap-2 px-5 py-2.5 rounded-full border border-(--theme-text) text-sm font-bold transition-all hover:bg-(--theme-text) hover:text-(--theme-bg) active:scale-95"
              >
                <RotateCcw size={16} /> Solicitar Devolución
              </button>
            ) : isDelivered ? (
              <p className="text-xs opacity-50 italic flex items-center gap-1.5">
                <Info size={14} /> El plazo para devolver este pedido ha expirado.
              </p>
            ) : (
              <p className="text-xs opacity-50 italic flex items-center gap-1.5">
                <Info size={14} /> Las devoluciones solo están disponibles para pedidos entregados.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Package,
  Phone,
  Send,
  Truck,
  XCircle,
} from 'lucide-react';
import PaymentSuccessModal from '../modals/PaymentSuccessModal';
import ConfirmPaymentModal from '../modals/Confirmpaymentmodal';
import UndeliveredModal from '../modals/UndeliveredModal';
import ConfirmAssignedOrderActionModal, {
  type AssignedOrderAction,
} from '../modals/ConfirmAssignedOrderActionModal';
import { auth } from '../../../lib/firebase';
import { parseOrderId } from '../../cart/services/orderService';
import {
  acceptMessengerOrder,
  getMessengerOrderById,
  markMessengerOrderAsNotDelivered,
  registerMessengerCashPayment,
  setMessengerOrderStatus,
} from '../services/messengerOrdersService';
import type { MessengerOrder } from '../types';
import { getDeliveryStatusLabel } from '../utils/deliveryStatusFlow';
import { formatBolivianos } from '../utils/money';
import { ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE } from '../utils/acceptEligibility';
import AcceptBlockedModal from '../modals/AcceptBlockedModal';
import './MessengerDashboard.css';

const DEV_COURIER_ID = 'user-nadia';

const formatDate = (date: Date | null | undefined) => {
  if (!date) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const buildBuyerMapUrl = (order: MessengerOrder) => {
  const url = new URL('/mapa', window.location.origin);

  if (order.deliveryLat != null && order.deliveryLng != null) {
    url.searchParams.set('lat', String(order.deliveryLat));
    url.searchParams.set('lng', String(order.deliveryLng));
  }

  url.searchParams.set('order', order.id);
  return url.toString();
};

const storeBuyerMapOrder = (order: MessengerOrder) => {
  localStorage.setItem(
    'courier_panel_order',
    JSON.stringify({
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      reference: order.reference || order.locationLabel,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      cashToCollect: order.cashToCollect,
    })
  );
};

const getStatusUpdateMessage = (status: MessengerOrder['deliveryStatus']) => {
  if (status === 'accepted') return 'Pedido aceptado correctamente.';
  if (status === 'in_transit') return 'Entrega iniciada correctamente.';
  if (status === 'pending_reassignment') {
    return 'Pedido rechazado y enviado a reasignacion.';
  }
  if (status === 'not_delivered') return 'Pedido marcado como no entregado.';
  if (status === 'cancelled') return 'Pedido cancelado por falta de pago.';
  if (status === 'delivered') return 'Pago registrado y pedido entregado.';
  return `Estado actualizado a ${getDeliveryStatusLabel(status)}.`;
};

function CopyableOrderId({ order }: { order: MessengerOrder }) {
  const { uuid, friendlyName } = parseOrderId(order.id);
  const displayId = order.displayId ?? friendlyName;
  const showTechnicalId = !order.displayId;

  return (
    <button
      className="block text-left"
      onClick={() => void navigator.clipboard?.writeText(order.id)}
      title="Copiar ID del pedido"
      type="button"
    >
      {showTechnicalId && (
        <p className="font-mono text-[10px] font-bold opacity-40">{uuid}</p>
      )}
      <h1 className="text-3xl font-black tracking-normal">{displayId}</h1>
    </button>
  );
}

function DetailActions({
  order,
  onAssignedAction,
  onDelivered,
  onInTransit,
  onNotDelivered,
}: {
  order: MessengerOrder;
  onAssignedAction: (action: AssignedOrderAction) => void;
  onDelivered: () => void;
  onInTransit: () => void;
  onNotDelivered: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <a
        className="messenger-map-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-bold transition"
        href={buildBuyerMapUrl(order)}
        onClick={() => storeBuyerMapOrder(order)}
      >
        <Send size={17} />
        Abrir Maps
      </a>

      {order.deliveryStatus === 'assigned' && (
        <>
          <button
            className="messenger-deliver-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition"
            onClick={() => onAssignedAction('accept')}
            type="button"
          >
            <CheckCircle2 size={17} />
            Aceptar pedido
          </button>
          <button
            className="messenger-reject-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-bold transition"
            onClick={() => onAssignedAction('reject')}
            type="button"
          >
            <XCircle size={17} />
            Rechazar
          </button>
        </>
      )}

      {order.deliveryStatus === 'accepted' && (
        <button
          className="messenger-transit-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold shadow-lg transition"
          onClick={onInTransit}
          type="button"
        >
          <Truck size={17} />
          Iniciar entrega
        </button>
      )}

      {order.deliveryStatus === 'in_transit' && (
        <button
          className="messenger-deliver-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition"
          onClick={onDelivered}
          type="button"
        >
          <CheckCircle2 size={17} />
          Registrar pago
        </button>
      )}

      {(order.deliveryStatus === 'accepted' || order.deliveryStatus === 'in_transit') && (
        <button
          className="messenger-reject-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-bold transition"
          onClick={onNotDelivered}
          type="button"
        >
          <AlertTriangle size={17} />
          No entregado
        </button>
      )}

    </div>
  );
}

export default function DeliveryOrderDetailPage({ orderId }: { orderId: string }) {
  const [courierId, setCourierId] = useState<string | null>(null);
  const [order, setOrder] = useState<MessengerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingAssignedAction, setPendingAssignedAction] = useState<{
    order: MessengerOrder;
    action: AssignedOrderAction;
  } | null>(null);
  const [savingAssignedAction, setSavingAssignedAction] = useState(false);
  const [undeliveredOrder, setUndeliveredOrder] = useState<MessengerOrder | null>(null);
  const [savingUndelivered, setSavingUndelivered] = useState(false);
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<MessengerOrder | null>(
    null
  );
  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false);
  const [acceptBlockedOpen, setAcceptBlockedOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCourierId(user?.uid ?? DEV_COURIER_ID);
    });
  }, []);

  const loadOrder = useCallback(async (options: { showLoading?: boolean } = {}) => {
    if (!courierId) return;

    const showLoading = options.showLoading ?? true;
    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const currentOrder = await getMessengerOrderById(courierId, orderId);
      setOrder(currentOrder);
      if (!currentOrder) {
        setError('No se encontro este pedido para el mensajero actual.');
      }
    } catch (loadError) {
      console.error(loadError);
      setError('No se pudo cargar el detalle del pedido.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [courierId, orderId]);

  useEffect(() => {
    // This page must refresh from Firestore when the courier session resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrder({ showLoading: true });
  }, [loadOrder]);

  const totals = useMemo(() => {
    const subtotal =
      order?.items.reduce((total, item) => total + item.price * item.quantity, 0) ?? 0;
    const deliveryCost = Math.max((order?.cashToCollect ?? 0) - subtotal, 0);

    return { subtotal, deliveryCost };
  }, [order]);

  const updateStatus = async (
    status: MessengerOrder['deliveryStatus'],
    rejectionReason?: string
  ) => {
    if (!order) return;

    const previousOrder = order;
    const updatedOrder = { ...order, deliveryStatus: status };
    
    // Si es rechazo y hay motivo, incluirlo
    if (status === 'pending_reassignment' && rejectionReason) {
      updatedOrder.rejectionReason = rejectionReason;
    }

    setOrder(updatedOrder);
    setMessage('');
    setError('');

    try {
      if (status === 'accepted') {
        // Mismo punto único que el dashboard: revalida contra Firestore que no
        // haya otra entrega activa antes de aceptar, sin importar desde qué
        // pantalla se dispare la acción.
        if (!courierId) {
          throw new Error('No se pudo identificar al mensajero.');
        }
        await acceptMessengerOrder(previousOrder, courierId);
      } else {
        await setMessengerOrderStatus(
          previousOrder,
          status,
          status === 'pending_reassignment' ? rejectionReason : undefined
        );
      }
      setMessage(getStatusUpdateMessage(status));
      await loadOrder({ showLoading: false });
    } catch (statusError) {
      console.error(statusError);
      setOrder(previousOrder);
      if (
        statusError instanceof Error &&
        statusError.message === ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE
      ) {
        // Misma UX que el dashboard: si el servicio bloquea por tener otra
        // entrega activa, mostramos la modal en lugar de un error suelto.
        setAcceptBlockedOpen(true);
      } else {
        setError(
          statusError instanceof Error
            ? statusError.message
            : 'No se pudo actualizar el estado del pedido.'
        );
      }
    }
  };

  const confirmAssignedOrderAction = async (reason?: string) => {
    if (!pendingAssignedAction || savingAssignedAction) return;

    const { action } = pendingAssignedAction;

    // Validar motivo solo para rechazo
    if (action === 'reject' && !reason?.trim()) {
      setError('Debes seleccionar un motivo para rechazar el pedido.');
      return;
    }

    const nextStatus = action === 'accept' ? 'accepted' : 'pending_reassignment';

    setSavingAssignedAction(true);
    try {
      await updateStatus(nextStatus, action === 'reject' ? reason : undefined);
      setPendingAssignedAction(null);
    } finally {
      setSavingAssignedAction(false);
    }
  };

  const registerUndeliveredOrder = async (reason: string, notes: string) => {
    if (!undeliveredOrder || !courierId) return;

    const previousOrder = undeliveredOrder;
    setSavingUndelivered(true);
    setOrder({ ...previousOrder, deliveryStatus: 'not_delivered' });

    try {
      await markMessengerOrderAsNotDelivered({
        order: previousOrder,
        reason,
        notes,
        courierId,
      });
      setMessage(getStatusUpdateMessage('not_delivered'));
      setUndeliveredOrder(null);
      await loadOrder({ showLoading: false });
    } catch (incidentError) {
      console.error(incidentError);
      setOrder(previousOrder);
      setError('No se pudo registrar el incidente.');
    } finally {
      setSavingUndelivered(false);
    }
  };

  const confirmPayment = async (targetOrder: MessengerOrder, secret: string) => {
    if (!courierId) throw new Error('No se pudo identificar al mensajero.');
    if (secret !== targetOrder.secret) throw new Error('Codigo incorrecto.');

    const previousOrder = targetOrder;
    setOrder({
      ...targetOrder,
      deliveryStatus: 'delivered',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      collectedBy: courierId,
      paymentCollectedAt: new Date(),
    });

    try {
      await registerMessengerCashPayment(targetOrder, courierId);
      setConfirmPaymentOrder(null);
      setPaymentSuccessOpen(true);
      setMessage(getStatusUpdateMessage('delivered'));
      await loadOrder({ showLoading: false });
    } catch (paymentError) {
      console.error(paymentError);
      setOrder(previousOrder);
      throw paymentError;
    }
  };

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4">
        <div className="messenger-order-card flex items-center gap-3 rounded-[28px] border p-8 text-sm font-bold">
          <LoaderCircle className="animate-spin" size={20} />
          Cargando detalle del pedido...
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <a
          className="messenger-map-button mb-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 px-5 text-sm font-bold transition"
          href="/courier"
        >
          <ArrowLeft size={17} />
          Volver a entregas
        </a>
        <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-bold">
          {error || 'No se encontro este pedido.'}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <a
        className="messenger-map-button mb-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 px-5 text-sm font-bold transition"
        href="/courier"
      >
        <ArrowLeft size={17} />
        Volver a entregas
      </a>

      <article className="messenger-order-card rounded-[28px] border p-6 shadow-[0_14px_30px_rgba(38,33,22,0.10)]">
        <div className="flex flex-col gap-5 border-b border-border-light pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <CopyableOrderId order={order} />
              <span className="messenger-status-badge rounded-full px-3 py-1 text-xs font-bold">
                {getDeliveryStatusLabel(order.deliveryStatus)}
              </span>
              <span className="messenger-charge-badge rounded-full px-3 py-1 text-xs font-bold">
                {order.paymentStatusLabel.toUpperCase()}
              </span>
            </div>
            <p className="messenger-copy text-sm font-semibold">
              Ultima actividad: {formatDate(order.updatedAt ?? order.assignedAt)}
            </p>
          </div>

          <div className="messenger-cash-box rounded-2xl border-2 p-5 lg:min-w-72">
            <p className="text-xs font-medium uppercase">Monto a cobrar</p>
            <p className="mt-2 text-3xl font-black">
              {formatBolivianos(order.cashToCollect)}
            </p>
            <p className="messenger-copy mt-1 text-xs">en efectivo</p>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
              error
                ? 'border-(--theme-error-border) bg-(--theme-error-bg) text-(--theme-error)'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <section>
              <p className="messenger-muted mb-3 text-xs font-bold uppercase">
                Cliente
              </p>
              <div className="messenger-copy space-y-4 text-sm">
                <p className="text-xl font-black">{order.customerName}</p>
                <p className="flex items-center gap-2">
                  <Phone size={16} />
                  <a className="hover:text-green-600" href={`tel:${order.phone}`}>
                    {order.phone}
                  </a>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  <span>
                    {order.address}
                    <span className="messenger-muted block text-xs">{order.city}</span>
                  </span>
                </p>
                {order.reference && (
                  <p className="messenger-reference border-l-4 px-3 py-3 text-xs font-medium">
                    {order.reference}
                  </p>
                )}
              </div>
            </section>

            <DetailActions
              order={order}
              onAssignedAction={(action) => setPendingAssignedAction({ order, action })}
              onDelivered={() => setConfirmPaymentOrder(order)}
              onInTransit={() => void updateStatus('in_transit')}
              onNotDelivered={() => setUndeliveredOrder(order)}
            />
          </div>

          <div>
            <p className="messenger-muted mb-3 text-xs font-medium">Productos</p>
            <div className="space-y-3">
              {order.items.length > 0 ? (
                order.items.map((item) => (
                  <p
                    className="messenger-copy flex items-center gap-2 text-sm"
                    key={item.id}
                  >
                    <Package size={16} />
                    <span>
                      {item.quantity}x {item.name} - {formatBolivianos(item.price)}
                    </span>
                  </p>
                ))
              ) : (
                <p className="messenger-copy text-sm font-semibold">
                  Este pedido no tiene productos visibles.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3 rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5 text-sm font-bold">
              <p className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatBolivianos(totals.subtotal)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>Costo de entrega</span>
                <span>{formatBolivianos(totals.deliveryCost)}</span>
              </p>
              <p className="flex justify-between gap-3 pt-4 text-primary">
                <span>Total final</span>
                <span>{formatBolivianos(order.cashToCollect)}</span>
              </p>
            </div>
          </div>
        </div>
      </article>

      {pendingAssignedAction && (
        <ConfirmAssignedOrderActionModal
          action={pendingAssignedAction.action}
          isSaving={savingAssignedAction}
          order={pendingAssignedAction.order}
          onClose={() => setPendingAssignedAction(null)}
          onConfirm={confirmAssignedOrderAction}
        />
      )}

      {undeliveredOrder && (
        <UndeliveredModal
          isSaving={savingUndelivered}
          order={undeliveredOrder}
          onClose={() => setUndeliveredOrder(null)}
          onConfirm={registerUndeliveredOrder}
        />
      )}

      {confirmPaymentOrder && (
        <ConfirmPaymentModal
          order={confirmPaymentOrder}
          onClose={() => setConfirmPaymentOrder(null)}
          onConfirm={confirmPayment}
        />
      )}

      {paymentSuccessOpen && (
        <PaymentSuccessModal onClose={() => setPaymentSuccessOpen(false)} />
      )}

      {acceptBlockedOpen && (
        <AcceptBlockedModal onClose={() => setAcceptBlockedOpen(false)} />
      )}
    </section>
  );
}

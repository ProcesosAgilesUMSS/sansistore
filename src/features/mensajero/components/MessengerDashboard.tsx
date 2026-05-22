import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  MapPin,
  Package,
  Phone,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { auth } from '../../../lib/firebase';
import {
  getMessengerOrders,
  markMessengerOrderAsNotDelivered,
  setMessengerOrderStatus,
} from '../services/messengerOrdersService';
import type { MessengerOrder } from '../types';
import UndeliveredModal from '../modals/UndeliveredModal';

const DEV_COURIER_ID = 'user-nadia';

const formatBolivianos = (amount: number) => `Bs ${amount}`;

const formatDeliveryStatus = (status: MessengerOrder['deliveryStatus']) => {
  if (status === 'assigned') return 'Asignado';
  if (status === 'accepted') return 'Aceptado';
  if (status === 'pending_reassignment') return 'Pendiente de reasignacion';
  if (status === 'in_transit') return 'En camino';
  if (status === 'not_delivered') return 'No entregado';
  return 'Entregado';
};

function SummaryCard({
  icon,
  label,
  value,
  featured = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  featured?: boolean;
}) {
  return (
    <article
      className={`messenger-summary-card rounded-[28px] border px-7 py-8 shadow-[0_14px_30px_rgba(38,33,22,0.10)] ${
        featured ? 'messenger-summary-card--featured' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            featured ? 'messenger-icon--featured' : 'messenger-icon'
          }`}
        >
          {icon}
        </span>
        <span className="messenger-muted text-sm font-medium">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-normal">{value}</p>
    </article>
  );
}

function PendingOrderCard({
  order,
  onAccept,
  onDelivered,
  onDetail,
  onInTransit,
  onNotDelivered,
  onReject,
}: {
  order: MessengerOrder;
  onAccept: (orderId: string) => void;
  onDelivered: (orderId: string) => void;
  onDetail: (order: MessengerOrder) => void;
  onInTransit: (orderId: string) => void;
  onNotDelivered: (order: MessengerOrder) => void;
  onReject: (orderId: string) => void;
}) {
  return (
    <article className="messenger-order-card rounded-[28px] border p-6 shadow-[0_14px_30px_rgba(38,33,22,0.10)]">
      <div className="messenger-order-grid grid gap-8">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-base font-black">#{order.id}</h3>
            <span className="messenger-status-badge rounded-full px-3 py-1 text-xs font-bold">
              {formatDeliveryStatus(order.deliveryStatus)}
            </span>
            <span className="messenger-charge-badge rounded-full px-3 py-1 text-xs font-bold">
              COBRAR
            </span>
          </div>

          <div className="messenger-copy space-y-4 text-sm">
            <div>
              <p className="messenger-muted mb-1 text-xs">Cliente</p>
              <p className="font-bold">{order.customerName}</p>
            </div>

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
                <span className="messenger-muted block text-xs">
                  {order.city}
                </span>
              </span>
            </p>

            {order.reference && (
              <p className="messenger-reference border-l-4 px-3 py-3 text-xs font-medium">
                {order.reference}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="messenger-muted mb-3 text-xs font-medium">Productos</p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <p
                className="messenger-copy flex items-center gap-2 text-sm"
                key={item.id}
              >
                <Package size={16} />
                <span>
                  {item.quantity}x {item.name} — {formatBolivianos(item.price)}
                </span>
              </p>
            ))}
          </div>

          <div className="messenger-cash-box mt-5 rounded-2xl border-2 p-5">
            <p className="text-xs font-medium uppercase">Monto a cobrar</p>
            <p className="mt-2 text-3xl font-black">
              {formatBolivianos(order.cashToCollect)}
            </p>
            <p className="messenger-copy mt-1 text-xs">en efectivo</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
          type="button"
          onClick={() => {
            const url = new URL('/mapa', window.location.origin);
            if (order.lat != null && order.lng != null) {
              url.searchParams.set('lat', String(order.lat));
              url.searchParams.set('lng', String(order.lng));
            } else {
              url.searchParams.set('location', order.address);
            }
            window.location.href = url.toString();
          }}
        >
          <Send size={17} />
          Abrir en Maps
        </button>

        {order.deliveryStatus !== 'assigned' && (
          <button
            className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
            onClick={() => onDetail(order)}
            type="button"
          >
            <Eye size={17} />
            Ver detalle
          </button>
        )}

        {order.deliveryStatus === 'assigned' && (
          <>
            <button
              className="messenger-deliver-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition"
              onClick={() => onAccept(order.id)}
              type="button"
            >
              <CheckCircle2 size={17} />
              Aceptar pedido
            </button>
            <button
              className="messenger-reject-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
              onClick={() => onReject(order.id)}
              type="button"
            >
              <XCircle size={17} />
              Rechazar
            </button>
          </>
        )}

        {order.deliveryStatus === 'accepted' && (
          <button
            className="messenger-transit-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
            onClick={() => onInTransit(order.id)}
            type="button"
          >
            Iniciar entrega
          </button>
        )}

        {order.deliveryStatus === 'in_transit' && (
          <button
            className="messenger-deliver-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition"
            onClick={() => onDelivered(order.id)}
            type="button"
          >
            <CheckCircle2 size={17} />
            Marcar como Entregado
          </button>
        )}

        {(order.deliveryStatus === 'accepted' ||
          order.deliveryStatus === 'in_transit') && (
          <button
            className="messenger-reject-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
            onClick={() => onNotDelivered(order)}
            type="button"
          >
            <AlertTriangle size={17} />
            No entregado
          </button>
        )}
      </div>
    </article>
  );
}

function DeliveredOrderRow({ order }: { order: MessengerOrder }) {
  return (
    <article className="messenger-delivered-row flex items-center justify-between gap-4 rounded-[26px] border p-6 shadow-[0_10px_24px_rgba(18,32,56,0.06)]">
      <div className="flex items-center gap-4">
        <span className="messenger-icon inline-flex h-10 w-10 items-center justify-center rounded-full">
          <CheckCircle2 size={20} />
        </span>
        <div>
          <h3 className="font-black">#{order.id}</h3>
          <p className="messenger-copy text-sm">{order.customerName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="messenger-delivered-badge rounded-full px-3 py-1 text-xs font-bold">
          Entregado
        </span>
        <strong>{formatBolivianos(order.cashToCollect)}</strong>
      </div>
    </article>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onDelivered,
  onNotDelivered,
}: {
  order: MessengerOrder;
  onClose: () => void;
  onDelivered: (orderId: string) => void;
  onNotDelivered: (order: MessengerOrder) => void;
}) {
  const subtotal = order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const deliveryCost = Math.max(order.cashToCollect - subtotal, 0);

  return (
    <div
      className="fixed inset-0 z-[998] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-normal">
              Detalle de cobro del pedido
            </h2>
            <p className="text-sm font-semibold opacity-70">
              Verifica el pedido antes de marcarlo como entregado.
            </p>
          </div>
          <button
            aria-label="Cerrar detalle"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <article className="rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-black">#{order.id}</h3>
                <span className="messenger-status-badge rounded-full px-3 py-1 text-xs font-bold">
                  {formatDeliveryStatus(order.deliveryStatus)}
                </span>
                <span className="messenger-charge-badge rounded-full px-3 py-1 text-xs font-bold">
                  COBRAR
                </span>
              </div>
              <p className="messenger-muted mt-5 text-xs font-bold uppercase">
                Cliente
              </p>
              <p className="text-xl font-black">{order.customerName}</p>
            </article>

            <article className="rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5">
              <h3 className="mb-4 text-lg font-black">Productos</h3>
              {order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <p
                      className="messenger-copy flex items-center gap-2 text-sm"
                      key={item.id}
                    >
                      <Package size={16} />
                      <span>
                        {item.quantity}x {item.name} -{' '}
                        {formatBolivianos(item.price)}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold">
                  Este pedido no tiene items visibles en el documento.
                </p>
              )}
            </article>

            <article className="grid gap-4 rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5 sm:grid-cols-3">
              <div>
                <p className="messenger-muted text-xs font-bold uppercase">
                  Metodo de pago
                </p>
                <p className="font-black">Contra entrega</p>
              </div>
              <div>
                <p className="messenger-muted text-xs font-bold uppercase">
                  Metodo de envio
                </p>
                <p className="font-black">Delivery</p>
              </div>
              <div>
                <p className="messenger-muted text-xs font-bold uppercase">
                  Condiciones especiales
                </p>
                <p className="font-black">{order.reference || 'Ninguna'}</p>
              </div>
            </article>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                type="button"
                onClick={() => {
                  const url = new URL('/mapa', window.location.origin);
                  if (order.lat != null && order.lng != null) {
                    url.searchParams.set('lat', String(order.lat));
                    url.searchParams.set('lng', String(order.lng));
                  } else {
                    url.searchParams.set('location', order.address);
                  }
                  window.location.href = url.toString();
                }}
              >
                <Send size={17} />
                Abrir en Maps
              </button>
            </div>
          </div>

          <aside className="messenger-cash-box h-fit rounded-[24px] border-2 p-5">
            <p className="text-xs font-bold uppercase">Te llevas a cobrar</p>
            <p className="mt-2 text-3xl font-black">
              {formatBolivianos(order.cashToCollect)}
            </p>
            <p className="messenger-copy mt-1 text-xs">
              {order.items.length} items en este pedido
            </p>
            <div className="my-5 border-t border-border-light" />
            <div className="space-y-3 text-sm font-bold">
              <p className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatBolivianos(subtotal)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>Costo de entrega</span>
                <span>{formatBolivianos(deliveryCost)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>Descuento</span>
                <span>{formatBolivianos(0)}</span>
              </p>
              <p className="flex justify-between gap-3 pt-4 text-primary">
                <span>Total final</span>
                <span>{formatBolivianos(order.cashToCollect)}</span>
              </p>
            </div>

            {order.deliveryStatus === 'in_transit' && (
              <button
                className="messenger-deliver-button mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition"
                onClick={() => {
                  onDelivered(order.id);
                  onClose();
                }}
                type="button"
              >
                <CheckCircle2 size={17} />
                Marcar como entregado
              </button>
            )}

            {(order.deliveryStatus === 'accepted' ||
              order.deliveryStatus === 'in_transit') && (
              <button
                className="messenger-reject-button mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                onClick={() => {
                  onClose();
                  onNotDelivered(order);
                }}
                type="button"
              >
                <AlertTriangle size={17} />
                No entregado
              </button>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

interface MessengerDashboardProps {
  embedded?: boolean;
  clientSection?: 'assigned' | 'accepted' | 'delivered' | 'not_delivered';
}

export default function MessengerDashboard({
  embedded = false,
  clientSection = 'assigned',
}: MessengerDashboardProps) {
  const [orders, setOrders] = useState<MessengerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [detailOrder, setDetailOrder] = useState<MessengerOrder | null>(null);
  const [undeliveredOrder, setUndeliveredOrder] =
    useState<MessengerOrder | null>(null);
  const [savingUndelivered, setSavingUndelivered] = useState(false);

  useEffect(() => {
    const loadOrders = async (courierId: string, allowDevFallback = false) => {
      setLoading(true);
      setMessage('');

      try {
        let data = await getMessengerOrders(courierId);

        if (
          data.length === 0 &&
          allowDevFallback &&
          import.meta.env.PUBLIC_APP_ENV !== 'production' &&
          courierId !== DEV_COURIER_ID
        ) {
          data = await getMessengerOrders(DEV_COURIER_ID);
        }

        setOrders(data);
      } catch (error) {
        console.error(error);
        setOrders([]);
        setMessage('No se pudieron cargar las entregas del emulador.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const devCourierId =
        import.meta.env.PUBLIC_APP_ENV !== 'production' ? DEV_COURIER_ID : null;
      const courierId = user?.uid || devCourierId;
      const allowDevFallback = !user;

      if (!courierId) {
        setOrders([]);
        setLoading(false);
        setMessage('Inicia sesion para ver tus entregas asignadas.');
        return;
      }

      void loadOrders(courierId, allowDevFallback);
    });

    return unsubscribe;
  }, []);

  const assignedOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'assigned'),
    [orders]
  );
  const acceptedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.deliveryStatus === 'accepted' ||
          order.deliveryStatus === 'in_transit'
      ),
    [orders]
  );
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'delivered'),
    [orders]
  );
  const notDeliveredOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'not_delivered'),
    [orders]
  );

  const updateOrderStatus = async (
    orderId: string,
    status: MessengerOrder['deliveryStatus']
  ) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) return;

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              deliveryStatus: status,
            }
          : order
      )
    );

    try {
      await setMessengerOrderStatus(targetOrder, status);
      setMessage('Estado actualizado correctamente.');
    } catch (error) {
      console.error(error);
      setMessage('No se pudo actualizar el estado en Firestore.');
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? targetOrder : order
        )
      );
    }
  };

  const markAsDelivered = (orderId: string) => {
    void updateOrderStatus(orderId, 'delivered');
  };

  const acceptOrder = (orderId: string) => {
    void updateOrderStatus(orderId, 'accepted');
  };

  const markAsInTransit = (orderId: string) => {
    void updateOrderStatus(orderId, 'in_transit');
  };

  const rejectOrder = (orderId: string) => {
    void updateOrderStatus(orderId, 'pending_reassignment');
  };

  const registerUndeliveredOrder = async (reason: string, notes: string) => {
    if (!undeliveredOrder) return;

    const targetOrder = undeliveredOrder;
    setSavingUndelivered(true);
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === targetOrder.id
          ? { ...order, deliveryStatus: 'not_delivered' }
          : order
      )
    );

    try {
      await markMessengerOrderAsNotDelivered({
        order: targetOrder,
        reason,
        notes,
      });
      setMessage('Incidente registrado correctamente.');
      setUndeliveredOrder(null);
    } catch (error) {
      console.error(error);
      setMessage('No se pudo registrar el incidente en Firestore.');
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === targetOrder.id ? targetOrder : order
        )
      );
    } finally {
      setSavingUndelivered(false);
    }
  };

  const activeOrders =
    clientSection === 'assigned'
      ? assignedOrders
      : clientSection === 'not_delivered'
        ? notDeliveredOrders
        : acceptedOrders;
  const activeTitle =
    clientSection === 'assigned'
      ? 'Gestión Entregas'
      : clientSection === 'accepted'
        ? 'Pedidos aceptados'
        : clientSection === 'not_delivered'
          ? 'No entregados'
          : 'Entregados';
  const activeDescription =
    clientSection === 'assigned'
      ? 'Acepta o rechaza los pedidos asignados antes de iniciar la entrega.'
      : clientSection === 'accepted'
        ? 'Organiza tus entregas, revisa direcciones y cambia el estado de cada pedido.'
        : clientSection === 'not_delivered'
          ? 'Revisa los pedidos con incidente registrado durante la jornada.'
          : 'Revisa las entregas completadas y el monto cobrado durante la jornada.';

  return (
    <main
      className={`messenger-dashboard ${embedded ? 'messenger-dashboard--embedded' : 'min-h-screen'}`}
    >
      <style>{`
        .messenger-dashboard {
          background: var(--theme-bg);
          color: var(--theme-text);
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          font-size: 16px;
          line-height: 1.5;
        }

        .messenger-dashboard * {
          box-sizing: border-box;
        }

        .messenger-dashboard a {
          color: inherit;
          text-decoration: none;
        }

        .messenger-dashboard--embedded {
          min-height: auto;
          background: transparent;
        }

        .messenger-header-inner {
          width: min(100% - 32px, 1216px);
          margin-inline: auto;
        }

        .messenger-container {
          width: min(100% - 32px, 1280px);
          margin-inline: auto;
        }

        .messenger-dashboard--embedded .messenger-container {
          width: min(100% - 32px, 1280px);
          padding-block: 8px 40px;
        }

        .messenger-header-inner {
          min-height: 73px;
        }

        .messenger-container {
          padding-block: 8px 40px;
        }

        .messenger-header,
        .messenger-order-card,
        .messenger-summary-card,
        .messenger-delivered-row {
          background: var(--theme-card-bg);
          border-color: var(--theme-border);
          color: var(--theme-text);
        }

        .messenger-header {
          border-bottom-color: var(--theme-border);
        }

        .messenger-logo-accent {
          color: #88b04b;
        }

        .messenger-buyer-link {
          background: var(--theme-card-bg);
          border-color: var(--theme-border);
          color: var(--theme-text);
        }

        .messenger-courier-link {
          background: #88b04b;
          color: #0a0b0d;
        }

        .messenger-muted,
        .messenger-copy {
          color: color-mix(in srgb, var(--theme-text) 72%, transparent);
        }

        .messenger-icon,
        .messenger-icon--featured {
          background: color-mix(in srgb, #88b04b 16%, var(--theme-card-bg));
          color: #6f9438;
        }

        .messenger-icon--featured {
          background: var(--theme-card-bg);
        }

        .messenger-summary-card--featured,
        .messenger-cash-box {
          background: color-mix(in srgb, #88b04b 14%, var(--theme-card-bg));
          border-color: color-mix(in srgb, #88b04b 58%, var(--theme-border));
          color: #5f8330;
        }

        .messenger-charge-badge {
          background: color-mix(in srgb, #facc15 22%, var(--theme-card-bg));
          color: #8a6100;
        }

        .messenger-status-badge {
          background: color-mix(in srgb, #3b82f6 14%, var(--theme-card-bg));
          color: #1d4ed8;
        }

        .messenger-reference {
          background: color-mix(in srgb, #facc15 18%, var(--theme-card-bg));
          border-left-color: #ffb703;
          color: #8a6100;
        }

        .messenger-map-button {
          background: var(--theme-card-bg);
          border-color: var(--theme-border);
          color: var(--theme-text);
        }

        .messenger-map-button:hover {
          border-color: #88b04b;
          color: #6f9438;
        }

        .messenger-transit-button {
          background: #2563eb;
          color: #ffffff;
        }

        .messenger-transit-button:hover {
          background: #1d4ed8;
        }

        .messenger-deliver-button {
          background: #88b04b;
          color: #0a0b0d;
        }

        .messenger-deliver-button:hover {
          background: #9fc462;
        }

        .messenger-reject-button {
          background: color-mix(in srgb, #ef4444 8%, var(--theme-card-bg));
          border-color: color-mix(in srgb, #ef4444 46%, var(--theme-border));
          color: #dc2626;
        }

        .messenger-reject-button:hover {
          background: color-mix(in srgb, #ef4444 14%, var(--theme-card-bg));
        }

        .messenger-delivered-badge {
          background: color-mix(in srgb, #88b04b 16%, var(--theme-card-bg));
          color: #5f8330;
        }

        html[data-theme='dark'] .messenger-icon,
        html[data-theme='dark'] .messenger-icon--featured {
          color: #b7dc78;
        }

        html[data-theme='dark'] .messenger-summary-card--featured,
        html[data-theme='dark'] .messenger-cash-box {
          color: #c4e48a;
        }

        html[data-theme='dark'] .messenger-charge-badge,
        html[data-theme='dark'] .messenger-reference {
          color: #fde68a;
        }

        html[data-theme='dark'] .messenger-status-badge {
          color: #93c5fd;
        }

        html[data-theme='dark'] .messenger-map-button:hover {
          color: #b7dc78;
        }

        html[data-theme='dark'] .messenger-delivered-badge {
          color: #b7dc78;
        }

        html[data-theme='dark'] .messenger-reject-button {
          color: #fca5a5;
        }

        @media (min-width: 768px) {
          .messenger-summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .messenger-order-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
        }
      `}</style>

      {!embedded && (
        <header className="messenger-header border-b">
          <div className="messenger-header-inner flex items-center justify-between">
            <a className="text-xl font-black tracking-normal" href="/">
              sansi <span className="messenger-logo-accent">store</span>
            </a>

            <div className="flex gap-2">
              <a
                className="messenger-buyer-link inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-bold"
                href="/"
              >
                Comprador
              </a>
              <a
                className="messenger-courier-link inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-bold"
                href="/courier"
              >
                Mensajero
              </a>
            </div>
          </div>
        </header>
      )}

      <div className="messenger-container">
        <section className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
            Operacion de entregas
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            {activeTitle}
          </h1>
          <p className="messenger-copy mt-2 max-w-2xl text-sm font-semibold">
            {activeDescription}
          </p>
        </section>

        {message && (
          <div className="messenger-order-card mt-6 rounded-[26px] border p-4 text-sm font-semibold">
            {message}
          </div>
        )}

        {loading && (
          <div className="messenger-order-card mt-6 rounded-[26px] border p-8 text-sm font-semibold">
            Cargando entregas...
          </div>
        )}

        {!loading && clientSection !== 'delivered' ? (
          <>
            <section className="messenger-summary-grid grid gap-5">
              <SummaryCard
                icon={<Clock3 size={20} />}
                label={
                  clientSection === 'assigned' ? 'Asignados' : 'Pendientes'
                }
                value={activeOrders.length}
              />
              <SummaryCard
                featured
                icon={<DollarSign size={20} />}
                label="Total a Cobrar"
                value={formatBolivianos(
                  activeOrders.reduce(
                    (total, order) => total + order.cashToCollect,
                    0
                  )
                )}
              />
            </section>

            <section className="mt-11">
              <h2 className="mb-6 text-2xl font-black tracking-[-0.04em]">
                {clientSection === 'assigned'
                  ? 'Pedidos asignados'
                  : clientSection === 'not_delivered'
                    ? 'Pedidos no entregados'
                    : 'Pedidos pendientes'}
              </h2>

              <div className="space-y-6">
                {activeOrders.length > 0 ? (
                  activeOrders.map((order) => (
                    <PendingOrderCard
                      key={order.id}
                      order={order}
                      onAccept={acceptOrder}
                      onDelivered={markAsDelivered}
                      onDetail={setDetailOrder}
                      onInTransit={markAsInTransit}
                      onNotDelivered={setUndeliveredOrder}
                      onReject={rejectOrder}
                    />
                  ))
                ) : (
                  <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-semibold">
                    {clientSection === 'assigned'
                      ? 'No hay pedidos asignados.'
                      : clientSection === 'not_delivered'
                        ? 'No hay pedidos no entregados.'
                        : 'No hay pedidos pendientes.'}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : !loading ? (
          <>
            <section className="messenger-summary-grid grid gap-5">
              <SummaryCard
                icon={<CheckCircle2 size={20} />}
                label="Cantidad completados"
                value={deliveredOrders.length}
              />
              <SummaryCard
                featured
                icon={<DollarSign size={20} />}
                label="Total cobrado"
                value={formatBolivianos(
                  deliveredOrders.reduce(
                    (total, order) => total + order.cashToCollect,
                    0
                  )
                )}
              />
            </section>

            <section className="mt-11">
              <h2 className="mb-6 text-2xl font-black tracking-[-0.04em]">
                Historial
              </h2>

              <div className="space-y-4">
                {deliveredOrders.length > 0 ? (
                  deliveredOrders.map((order) => (
                    <DeliveredOrderRow key={order.id} order={order} />
                  ))
                ) : (
                  <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-semibold">
                    No hay entregas completadas hoy.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onDelivered={markAsDelivered}
          onNotDelivered={setUndeliveredOrder}
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
    </main>
  );
}

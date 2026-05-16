import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  Package,
  Phone,
  Send,
} from 'lucide-react';
import { auth } from '../../../lib/firebase';
import {
  getMessengerOrders,
  setMessengerOrderStatus,
} from '../services/messengerOrdersService';
import type { MessengerOrder } from '../types';

const DEV_COURIER_ID = 'user-mensajero-001';


const formatBolivianos = (amount: number) => `Bs ${amount}`;

const formatDeliveryStatus = (status: MessengerOrder['deliveryStatus']) => {
  if (status === 'assigned') return 'Asignado';
  if (status === 'accepted') return 'Aceptado';
  if (status === 'pending_reassignment') return 'Pendiente de reasignacion';
  if (status === 'in_transit') return 'En camino';
  return 'Entregado';
};

const buildMapsUrl = (order: MessengerOrder) => {
  const query = encodeURIComponent(`${order.address}, ${order.city}, Bolivia`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
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
      className={`messenger-summary-card rounded-[28px] border px-7 py-8 shadow-[0_14px_30px_rgba(38,33,22,0.10)] ${featured ? 'messenger-summary-card--featured' : ''
        }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${featured ? 'messenger-icon--featured' : 'messenger-icon'
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
  onDelivered,
  onInTransit,
}: {
  order: MessengerOrder;
  onDelivered: (orderId: string) => void;
  onInTransit: (orderId: string) => void;
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
                <span className="messenger-muted block text-xs">{order.city}</span>
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
            <p className="text-xs font-medium uppercase">
              Monto a cobrar
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatBolivianos(order.cashToCollect)}
            </p>
            <p className="messenger-copy mt-1 text-xs">en efectivo</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
          href={buildMapsUrl(order)}
          rel="noreferrer"
          target="_blank"
        >
          <Send size={17} />
          Abrir en Maps
        </a>

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
        <strong>
          {formatBolivianos(order.cashToCollect)}
        </strong>
      </div>
    </article>
  );
}

interface MessengerDashboardProps {
  embedded?: boolean;
  clientSection?: 'assigned' | 'delivered';
}

export default function MessengerDashboard({
  embedded = false,
  clientSection = 'assigned',
}: MessengerDashboardProps) {
  const [orders, setOrders] = useState<MessengerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadOrders = async (courierId: string) => {
      setLoading(true);
      setMessage('');

      try {
        let data = await getMessengerOrders(courierId);

        if (
          data.length === 0 &&
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

      if (!courierId) {
        setOrders([]);
        setLoading(false);
        setMessage('Inicia sesion para ver tus entregas asignadas.');
        return;
      }

      void loadOrders(courierId);
    });

    return unsubscribe;
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'accepted' || order.deliveryStatus === 'in_transit'),
    [orders]
  );
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'delivered'),
    [orders]
  );
  const cashToCollect = useMemo(
    () =>
      pendingOrders.reduce((total, order) => total + order.cashToCollect, 0),
    [pendingOrders]
  );

  const updateOrderStatus = async (
    orderId: string,
    status: MessengerOrder['deliveryStatus'],
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

  const markAsInTransit = (orderId: string) => {
    void updateOrderStatus(orderId, 'in_transit');
  };

  return (
    <main className={`messenger-dashboard ${embedded ? 'messenger-dashboard--embedded' : 'min-h-screen'}`}>
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
            {clientSection === 'assigned' ? 'Pedidos aceptados' : 'Entregados'}
          </h1>
          <p className="messenger-copy mt-2 max-w-2xl text-sm font-semibold">
            {clientSection === 'assigned'
              ? 'Organiza tus entregas, revisa direcciones y cambia el estado de cada pedido.'
              : 'Revisa las entregas completadas y el monto cobrado durante la jornada.'}
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

        {!loading && clientSection === 'assigned' ? (
          <>
            <section className="messenger-summary-grid grid gap-5">
              <SummaryCard
                icon={<Clock3 size={20} />}
                label="Pendientes"
                value={pendingOrders.length}
              />
              <SummaryCard
                featured
                icon={<DollarSign size={20} />}
                label="Total a Cobrar"
                value={formatBolivianos(cashToCollect)}
              />
            </section>

            <section className="mt-11">
                <h2 className="mb-6 text-2xl font-black tracking-[-0.04em]">
                Pedidos pendientes
              </h2>

              <div className="space-y-6">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <PendingOrderCard
                      key={order.id}
                      order={order}
                      onDelivered={markAsDelivered}
                      onInTransit={markAsInTransit}
                    />
                  ))
                ) : (
                  <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-semibold">
                    No hay pedidos pendientes.
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
                  deliveredOrders.reduce((total, order) => total + order.cashToCollect, 0),
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
    </main>
  );
}


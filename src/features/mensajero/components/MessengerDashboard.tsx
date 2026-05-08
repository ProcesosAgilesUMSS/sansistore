import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  Package,
  Phone,
  Send,
} from 'lucide-react';
import type { MessengerOrder } from '../types';

const initialOrders: MessengerOrder[] = [
  {
    id: 'ORD-2026-001',
    customerName: 'María Fernández',
    phone: '70712345',
    address: 'Av. América #1234, Edificio Los Pinos, Piso 3',
    city: 'Cochabamba',
    reference: 'Casa con portón negro, llamar al llegar',
    cashToCollect: 260,
    paymentMethod: 'cash',
    deliveryStatus: 'pending',
    items: [
      {
        id: 'polera-verde',
        name: 'Polera casual verde',
        quantity: 1,
        price: 90,
      },
      {
        id: 'jeans-slim',
        name: 'Jeans slim fit',
        quantity: 1,
        price: 160,
      },
    ],
  },
  {
    id: 'ORD-2026-002',
    customerName: 'Carlos Rojas',
    phone: '76459821',
    address: 'Calle Bolívar #456, entre España y 25 de Mayo',
    city: 'Cochabamba',
    cashToCollect: 60,
    paymentMethod: 'cash',
    deliveryStatus: 'pending',
    items: [
      {
        id: 'sudadera-deportiva',
        name: 'Sudadera deportiva',
        quantity: 1,
        price: 60,
      },
    ],
  },
  {
    id: 'ORD-2026-003',
    customerName: 'Ana Vargas',
    phone: '70333444',
    address: 'Zona Cala Cala, Cochabamba',
    city: 'Cochabamba',
    cashToCollect: 180,
    paymentMethod: 'cash',
    deliveryStatus: 'delivered',
    items: [
      {
        id: 'zapatillas-urbanas',
        name: 'Zapatillas urbanas',
        quantity: 1,
        price: 180,
      },
    ],
  },
];

const formatBolivianos = (amount: number) => `Bs ${amount}`;

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
      className={`messenger-summary-card rounded-lg border p-6 ${featured ? 'messenger-summary-card--featured' : ''
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
    <article className="messenger-order-card rounded-lg border p-6">
      <div className="messenger-order-grid grid gap-8">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-base font-black">#{order.id}</h3>
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

          <div className="messenger-cash-box mt-5 rounded-lg border-2 p-5">
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
          className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 px-6 text-sm font-bold transition"
          href={buildMapsUrl(order)}
          rel="noreferrer"
          target="_blank"
        >
          <Send size={17} />
          Abrir en Maps
        </a>

        {order.deliveryStatus === 'pending' && (
          <button
            className="messenger-transit-button inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
            onClick={() => onInTransit(order.id)}
            type="button"
          >
            En camino
          </button>
        )}

        {order.deliveryStatus === 'in_transit' && (
          <button
            className="messenger-deliver-button inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold transition"
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
    <article className="messenger-delivered-row flex items-center justify-between gap-4 rounded-lg border p-6">
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

export default function MessengerDashboard() {
  const [orders, setOrders] = useState(initialOrders);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === 'pending' || order.deliveryStatus === 'in_transit'),
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

  const markAsDelivered = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
            ...order,
            deliveryStatus: 'delivered',
          }
          : order
      )
    );
  };
  const markAsInTransit = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, deliveryStatus: 'in_transit' }
          : order
      )
    );
  };

  return (
    <main className="messenger-dashboard min-h-screen">
      <style>{`
        .messenger-dashboard {
          background: #faf8f2;
          color: #020817;
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

        .messenger-header-inner,
        .messenger-container {
          width: min(100% - 32px, 1216px);
          margin-inline: auto;
        }

        .messenger-header-inner {
          min-height: 73px;
        }

        .messenger-container {
          padding-block: 40px;
        }

        .messenger-header,
        .messenger-order-card,
        .messenger-summary-card,
        .messenger-delivered-row {
          background: #ffffff;
          border-color: #dff2e4;
          color: #020817;
        }

        .messenger-header {
          border-bottom-color: #d7dde7;
        }

        .messenger-logo-accent {
          color: #34a853;
        }

        .messenger-buyer-link {
          background: #ffffff;
          border-color: #cfd6df;
          color: #1f2a44;
        }

        .messenger-courier-link {
          background: #45ad4d;
          color: #ffffff;
        }

        .messenger-muted,
        .messenger-copy {
          color: #334155;
        }

        .messenger-icon,
        .messenger-icon--featured {
          background: #e9f8ec;
          color: #41ad4b;
        }

        .messenger-icon--featured {
          background: #ffffff;
        }

        .messenger-summary-card--featured,
        .messenger-cash-box {
          background: #eaf7ed;
          border-color: #41ad4b;
          color: #34a853;
        }

        .messenger-charge-badge {
          background: #fff1bf;
          color: #8a6100;
        }

        .messenger-reference {
          background: #fff3cd;
          border-left-color: #ffb703;
          color: #8a6100;
        }

        .messenger-map-button {
          background: #ffffff;
          border-color: #cfd6df;
          color: #1f2a44;
        }

        .messenger-map-button:hover {
          border-color: #41ad4b;
          color: #2b9335;
        }

        .messenger-deliver-button {
          background: #45ad4d;
          color: #ffffff;
        }

        .messenger-deliver-button:hover {
          background: #2f9439;
        }

        .messenger-delivered-badge {
          background: #e9f8ec;
          color: #2f9d3a;
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
              href="/mensajero"
            >
              Mensajero
            </a>
          </div>
        </div>
      </header>

      <div className="messenger-container">
        <section>
          <h1 className="text-4xl font-black tracking-normal">
            Panel del Mensajero
          </h1>
          <p className="messenger-copy mt-2 text-base">
            Gestiona tus entregas y cobros
          </p>
        </section>

        <section className="messenger-summary-grid mt-9 grid gap-6">
          <SummaryCard
            icon={<Clock3 size={20} />}
            label="Pendientes"
            value={pendingOrders.length}
          />
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Entregados Hoy"
            value={deliveredOrders.length}
          />
          <SummaryCard
            featured
            icon={<DollarSign size={20} />}
            label="Total a Cobrar"
            value={formatBolivianos(cashToCollect)}
          />
        </section>

        <section className="mt-11">
          <h2 className="mb-6 text-2xl font-black tracking-normal">
            Pedidos Pendientes
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
              <div className="messenger-order-card rounded-lg border p-8 text-sm font-semibold">
                No hay pedidos pendientes.
              </div>
            )}
          </div>
        </section>

        <section className="mt-11">
          <h2 className="mb-6 text-2xl font-black tracking-normal">
            Entregados Hoy
          </h2>

          <div className="space-y-4">
            {deliveredOrders.map((order) => (
              <DeliveredOrderRow key={order.id} order={order} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

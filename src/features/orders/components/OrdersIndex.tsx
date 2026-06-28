import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types";
import { STATUS_LABELS } from "../types";
import { getSentOrders, subscribeToCreatedOrders } from "../services/ordersService";
import { auth } from "../../../lib/firebase";
import RouteGuard from "../../../components/RouteGuard";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import { parseOrderId } from "../../cart/services/orderService";
import {
  ChevronDown,
  Filter,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
});

const ALL_STATUSES: OrderStatus[] = [
  "CREADO",
  "RESERVADO",
  "PENDIENTE",
  "EMPAQUETADO",
  "EN CAMINO",
  "ENTREGADO",
];

const STATUS_DOT_COLOR: Record<string, string> = {
  CREADO: "bg-orange-500",
  RESERVADO: "bg-blue-500",
  PENDIENTE: "bg-yellow-500",
  EMPAQUETADO: "bg-purple-500",
  "EN CAMINO": "bg-blue-500",
  ENTREGADO: "bg-green-500",
};

export default function OrdersIndex() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [myOrdersOnly, setMyOrdersOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  useEffect(() => {
    let createdLoaded = false;
    let sentLoaded = false;
    const created: Order[] = [];
    const sent: Order[] = [];

    const unsub = subscribeToCreatedOrders((data) => {
      created.length = 0;
      created.push(...data);
      createdLoaded = true;
      if (sentLoaded) {
        setAllOrders([...created, ...sent].sort((a, b) => b.id.localeCompare(a.id)));
        setLoading(false);
      }
    });

    getSentOrders().then((data) => {
      sent.length = 0;
      sent.push(...data);
      sentLoaded = true;
      if (createdLoaded) {
        setAllOrders([...created, ...sent].sort((a, b) => b.id.localeCompare(a.id)));
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const currentUserId = auth.currentUser?.uid;

  const toggleStatus = (status: OrderStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  let displayOrders = [...allOrders];

  if (statusFilter.length > 0) {
    displayOrders = displayOrders.filter((o) => statusFilter.includes(o.status));
  }
  if (myOrdersOnly && currentUserId) {
    displayOrders = displayOrders.filter((o) => o.sellerId === currentUserId);
  }
  if (unassignedOnly) {
    displayOrders = displayOrders.filter((o) => !o.sellerId);
  }

  const deliveredOrders = allOrders.filter((o) => o.status === "ENTREGADO");
  const deliveredTotal = deliveredOrders.reduce((t, o) => t + (o.total ?? 0), 0);

  return (
    <RouteGuard allowedRoles={['vendedor']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-[-0.04em] leading-none text-text-light">
            Pedidos
          </h1>
          {!loading && (
            <p className="mt-2 text-sm text-text-light/60 font-medium">
              {displayOrders.length === 0
                ? "Sin pedidos"
                : `${displayOrders.length} ${displayOrders.length === 1 ? "pedido" : "pedidos"}`}
            </p>
          )}
        </div>

        {!loading && deliveredOrders.length > 0 && (
          <div className="mb-8 bg-card-bg-light border border-border-light rounded-[1.25rem] p-5">
            <p className="uppercase text-xs font-bold tracking-wider text-text-light/50 flex items-center gap-2 mb-3">
              <span className="text-primary">/</span>
              Rendición del día
            </p>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
              <p className="text-2xl font-black leading-none text-text-light">
                {currencyFormatter.format(deliveredTotal)}
              </p>
              <p className="text-sm text-text-light/50 pb-0.5">
                {deliveredOrders.length === 1
                  ? "1 pedido entregado cobrado"
                  : `${deliveredOrders.length} pedidos entregados cobrados`}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-text-light/50 hover:text-text-light transition-colors cursor-pointer"
            >
              <Filter size={14} />
              Estado
              <ChevronDown
                size={14}
                className={`transition-transform ${showFilter ? "rotate-180" : ""}`}
              />
            </button>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-text-light/50 cursor-pointer select-none hover:text-text-light transition-colors">
                <input
                  type="checkbox"
                  checked={myOrdersOnly}
                  onChange={(e) => {
                    setMyOrdersOnly(e.target.checked);
                    if (e.target.checked) setUnassignedOnly(false);
                  }}
                  className="accent-primary size-4"
                />
                Mis pedidos
              </label>
              <label className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-text-light/50 cursor-pointer select-none hover:text-text-light transition-colors">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    if (e.target.checked) setMyOrdersOnly(false);
                  }}
                  className="accent-primary size-4"
                />
                Sin asignar
              </label>
            </div>
          </div>

          {showFilter && (
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((status) => {
                const isSelected = statusFilter.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs uppercase font-bold tracking-wider border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "bg-secondary-bg-light text-text-light border-border-light shadow-sm hover:shadow-md"
                        : "bg-transparent text-text-light/50 border-transparent hover:text-text-light hover:border-border-light hover:bg-secondary-bg-light/50"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${STATUS_DOT_COLOR[status] || "bg-current"}`} />
                    {STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 gap-4">
            <GridSpinner />
            <LoadingMessage text="Cargando pedidos" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-text-light/40 font-medium">
              No hay pedidos
              {myOrdersOnly ? " para este vendedor" : ""}
              {unassignedOnly ? " sin asignar" : ""}
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayOrders.map((order) => (
              <OrderCard
                key={order.id + order.status}
                order={order}
              />
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border border-dotted border-[#1e1e1e44] dark:border-[#f5f3ef44] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-text-light"
    >
      <span className={`size-1.5 rounded-full ${STATUS_DOT_COLOR[status] || "bg-current"}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const { uuid, friendlyName } = parseOrderId(order.id);
  const handleClick = () => {
    window.location.href = `/orders/${order.id}`;
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-card-bg-light border border-border-light rounded-[1.25rem] p-4 sm:p-5 transition-all cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.99]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs font-bold text-text-light/40 truncate block">
            {uuid}
          </span>
          <span className="font-bold text-text-light group-hover:text-primary transition-colors">
            {friendlyName}
          </span>
          <p className="text-sm text-text-light/80 truncate mt-0.5">
            {order.delivery.destination}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <StatusBadge status={order.status} />
        </div>
      </div>
    </div>
  );
}

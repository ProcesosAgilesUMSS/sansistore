import type { AdminOrder } from "../types";

const STATUS_STYLES: Record<string, string> = {
  PAGADO: "bg-green-100 text-green-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CREADO: "bg-gray-100 text-gray-600",
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  RESERVADO: "bg-blue-100 text-blue-800",
  EMPAQUETADO: "bg-purple-100 text-purple-800",
  "EN CAMINO": "bg-teal-100 text-teal-800",
  CANCELADO: "bg-red-100 text-red-800",
  "NO ENTREGADO": "bg-red-100 text-red-800",
};

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function formatDate(dateStr: string | any): string {
  if (!dateStr) return "—";
  
  const date = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
  
  if (isNaN(date.getTime())) return "—";
  
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}



const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconDelete = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

interface OrdersTableProps {
  orders: AdminOrder[];
  onEdit: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
}

export default function OrdersTable({
  orders,
  onEdit,
  onDelete,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-(--theme-text)/40 text-sm">
        No se encontraron órdenes.
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE: tarjetas ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-(--theme-card-bg) border border-(--theme-border) rounded-xl p-4 space-y-3"
          >
            {/* Fila superior: nombre + acciones */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-(--theme-text) text-sm">
                  {order.customerName}
                </p>
                <p className="text-xs text-(--theme-text)/40 mt-0.5">
                  {order.customerPhone}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  title="Editar orden"
                  className="p-2 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <IconEdit />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(order)}
                  title="Eliminar orden"
                  className="p-2 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <IconDelete />
                </button>
              </div>
            </div>

            {/* ID */}
            <p
              title={order.id}
              className="font-mono text-xs text-(--theme-text)/40 truncate"
            >
              {order.id}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {order.status}
              </span>
              {order.deliveryStatus && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.deliveryStatus}
                </span>
              )}
            </div>

            {/* Fecha */}
            <p className="text-xs text-(--theme-text)/40">
              Creado: {formatDate(order.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: tabla ── */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-(--theme-border)">
        <table className="w-full text-sm" style={{ minWidth: "600px" }}>
          <thead>
            <tr className="bg-(--theme-text)/5 text-(--theme-text)/50 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 w-[160px]">Order ID</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Delivery</th>
              <th className="text-left px-4 py-3">Creado</th>
              <th className="text-center px-4 py-3 w-[80px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-(--theme-border) hover:bg-(--theme-text)/3 transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    title={order.id}
                    className="font-mono text-xs text-(--theme-text)/50 cursor-default"
                  >
                    {truncateId(order.id)}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-(--theme-text) whitespace-nowrap">
                  {order.customerName}
                </td>
                <td className="px-4 py-3 text-(--theme-text)/60 whitespace-nowrap">
                  {order.customerPhone}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.deliveryStatus ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        STATUS_STYLES[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.deliveryStatus}
                    </span>
                  ) : (
                    <span className="text-(--theme-text)/30 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-(--theme-text)/60 text-xs whitespace-nowrap">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(order)}
                      title="Editar orden"
                      className="p-1.5 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(order)}
                      title="Eliminar orden"
                      className="p-1.5 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <IconDelete />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
import { useEffect, useState } from "react";
import type { Order } from "@features/orders/types";
import { subscribeToOrder, getOrderById } from "@features/orders/services/ordersService";
import { ChevronDown } from "lucide-react";
import OrderStatusBadge from "@features/orders/components/OrderStatusBadge";
import OrderActions from "@features/orders/components/OrderActions";
import { parseOrderId } from "@features/cart/services/orderService";

export default function OrderDetailView({ orderId }: { orderId: string | undefined }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [selectedCol, setSelectedCol] = useState<'precio' | 'monto' | 'stock'>('monto');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    getOrderById(orderId)
      .then((data) => {
        if (!data) {
          setError(true);
        } else {
          setOrder(data);
        }
        document.getElementById("order-skeleton")?.remove();
      })
      .catch((err) => {
        console.error("Error fetching order:", err);
        setError(true);
        document.getElementById("order-skeleton")?.remove();
      });

    const unsub = subscribeToOrder(orderId, (update) => {
      setOrder((prev) => prev && { ...prev, ...update });
    });

    return () => unsub();
  }, [orderId]);

  const formatDate = (value: { toDate(): Date } | null | undefined) => {
    if (!value) return "N/A";
    const date = value.toDate();
    if (isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "BS 0.00";
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value);
  };

  if (!order && !error) return null;

  if (error) {
    return (
      <div className="mt-8">
        <p className="text-sm text-text-light/80">Pedido no encontrado</p>
      </div>
    );
  }

  if (!order) return null;

  const date = formatDate(order.createdAt);
  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-[65ch] max-[760px]:max-w-[480px] grid grid-cols-[repeat(16,_1fr)] max-[760px]:grid-cols-7 p-3 rounded-xl bg-card-bg-light shadow-2xl border border-border-light">
      <span className="col-span-full w-full block text-xs text-text-light/50 truncate">
        {parseOrderId(order.id).uuid}
      </span>

      <div className="col-span-full flex items-center justify-between mb-6">
        <span className="text-lg font-bold tracking-tight truncate">{parseOrderId(order.id).friendlyName}</span>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="col-start-1 col-end-4 max-[760px]:col-end-3 truncate text-sm text-text-light/50 leading-[120%]">Comprador:</div>
      <div className="col-start-4 col-end-13 max-[760px]:col-start-3 max-[760px]:col-end-7 leading-[120%]">{order.buyerName}</div>
      <div className="col-start-1 col-end-4 max-[760px]:col-end-3 truncate text-sm text-text-light/50 leading-[120%]">Creación: </div>
      <div className="col-start-4 col-end-13 max-[760px]:col-start-3 max-[760px]:col-end-7 leading-[120%]">{date}</div>
      <div className="col-start-1 col-end-4 max-[760px]:col-end-3 truncate text-sm text-text-light/50 leading-[120%]">Ubicación: </div>
      <div className={`col-start-4 col-end-13 max-[760px]:col-start-3 max-[760px]:col-end-8 leading-[120%] truncate ${order.status === "CANCELADO" ? "" : "mb-4"}`}>{order.address}</div>
      {order.status === "CANCELADO" &&
        <>
          <div className="col-start-1 col-end-4 max-[760px]:col-end-3 truncate text-sm text-text-light/50 leading-[120%]">Motivo:</div>
          <div className="col-start-4 col-end-13 max-[760px]:col-start-3 max-[760px]:col-end-7 leading-[120%] mb-4 ">{order.incidentReason}</div>
        </>
      }

      <div className="col-span-full grid grid-cols-subgrid">
        <div className="col-span-full grid grid-cols-subgrid border-y border-dashed py-0.5 items-center">
          <div className="col-start-1 col-end-3 max-[760px]:col-end-2">Cantidad</div>
          <div className="col-start-3 col-end-10 max-[760px]:col-start-2 max-[760px]:col-end-5 max-[760px]:ml-6">Producto</div>

          <div className="hidden min-[760px]:block col-start-11 col-end-13">Precio</div>
          <div className="hidden min-[760px]:block col-start-13 col-end-16 ml-6">Monto</div>
          <div className="hidden min-[760px]:block col-start-16 col-end-17">Stock</div>

          <div
            className="min-[760px]:hidden col-start-6 col-end-8 relative cursor-pointer hover:bg-secondary-bg-light transition-colors px-1 py-0.5 rounded flex items-center gap-1 justify-end select-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="capitalize">{selectedCol}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />

            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-card-bg-light border border-border-light shadow-lg rounded-md z-20 py-1 w-24">
                {(['precio', 'monto', 'stock'] as const).map((col) => (
                  <button
                    key={col}
                    className={`block w-full text-left px-3 py-1 text-sm hover:bg-secondary-bg-light capitalize ${selectedCol === col ? 'font-bold' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCol(col);
                      setIsMenuOpen(false);
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ul className="grid grid-cols-subgrid col-span-full py-1">
          {order.items.map((item, index) => (
            <li key={index} className="grid grid-cols-subgrid col-span-full items-center leading-[130%]">
              <div className="col-start-1 col-end-3 max-[760px]:col-end-2 ml-1">{item.quantity}</div>
              <div className="col-start-3 col-end-10 max-[760px]:col-start-2 max-[760px]:col-end-6 truncate max-[760px]:ml-6">{item.productName}</div>

              <div className="hidden min-[760px]:block col-start-11 col-end-13">{formatCurrency(item.unitPrice)}</div>
              <div className="hidden min-[760px]:block col-start-13 col-end-16 ml-6">{formatCurrency(item.subtotal)}</div>
              <div className="hidden min-[760px]:block col-start-16 col-end-17 justify-self-end">{item.stockAvailable}</div>

              <div className="min-[760px]:hidden col-start-6 col-end-8 text-right">
                {selectedCol === 'precio' && formatCurrency(item.unitPrice)}
                {selectedCol === 'monto' && formatCurrency(item.subtotal)}
                {selectedCol === 'stock' && item.stockAvailable}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-full py-1.5 border-y border-dashed">
        <div className="flex justify-between">
          Número de artículos:
          <span>{totalQuantity}</span>
        </div>
        <div className="flex justify-between">
          Total:
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="col-span-full flex justify-end mt-6">
        <OrderActions order={order} />
      </div>
    </div>
  );
}

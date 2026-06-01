import type { Order } from "../types";
import OrderStatusBadge from "./OrderStatusBadge";
import { paidOrder, readyOrder } from "../services/ordersService";

export default function SellerOrderItem({
  order,
  index,
  selectOrder
}: {
  order: Order;
  index: number;
  selectOrder: () => void
}) {
  const displayId = `ord-${(index + 1).toString().padStart(3, "0")}`;

  const handleReady = async () => {
    try {
      await readyOrder(order.id);
    } catch (error) {
      console.error("Error updating order to ready:", error);
      alert("Error al marcar la orden como lista. Por favor intenta de nuevo.");
    }
  };

  const handlePaid = async () => {
    try {
      await paidOrder(order.id);
    } catch (error) {
      console.error("Error updating order to paid:", error);
      alert("Error al marcar la orden como pagado. Por favor intenta de nuevo.");
    }
  };

  return (
    <li
      onClick={() => selectOrder()}
      className="grid grid-cols-subgrid col-span-full border-b py-[10px] min-[760px]:py-0 border-black/20 cursor-pointer hover:bg-black/5"
    >
      <div className="col-span-full min-[760px]:col-start-1 min-[760px]:col-end-3 text-sm flex items-center gap-[8px] text-xs uppercase">
        <div className="size-1.5 bg-[#1e1e1e]" />
        {displayId}
      </div>
      <div className="col-start-1 col-end-9 min-[760px]:col-start-3 min-[760px]:col-end-10 text-[calc(.78125vw+13.5px)] truncate
      min-[960px]:col-end-13 tracking-tight">
        {order.delivery.destination}
      </div>

      <div
        className="min-[960px]:col-start-14 min-[960px]:col-end-18 min-[760px]:col-start-10 min-[760px]:col-end-14 text-[11px] flex
        items-center col-span-full tracking-tight min-[760px]:ml-4 min-[960px]:ml-0"
      >
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "EMPAQUETADO" && (
        <button
          className="min-[760px]:col-start-16 min-[960px]:col-start-21 min-[960px]:col-end-23 text-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleReady();
          }}
        >
          <span className="border px-2 py-1 border-black/30 rounded">Listo</span>
        </button>
      )}

      {order.status === "ENTREGADO" && (
        <button
          className="text-left min-[760px]:col-start-16 min-[960px]:col-start-21 min-[960px]:col-end-23 text-sm underline decoration-2 cursor-pointer underline-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            handlePaid();
          }}
        >
          Pagado
        </button>
      )}
    </li>
  );
}

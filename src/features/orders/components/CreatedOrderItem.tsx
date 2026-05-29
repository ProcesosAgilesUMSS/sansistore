import type { Order } from "../types";
import { reserveOrder } from "../services/ordersService";

export default function CreatedOrderItem({
  order,
  index,
  selectOrder
}: {
  order: Order;
  index: number;
  selectOrder: (order: Order) => void
}) {
  const handleReserve = async () => {
    try {
      await reserveOrder(order.id);
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Error al confirmar el pedido. Por favor intenta de nuevo.");
    }
  };

  const displayId = `ord-${(index + 1).toString().padStart(3, "0")}`;

  return (
    <li
      onClick={() => selectOrder(order)}
      className="grid grid-cols-subgrid col-span-full border-b py-[10px] min-[760px]:py-0 border-black/20 cursor-pointer"
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
        className="min-[960px]:col-start-14 min-[960px]:col-end-16 min-[760px]:col-start-11 min-[760px]:col-end-13 text-[11px] flex
        items-center col-span-full tracking-tight"
      >
        <div className="border  border-black/20 px-0.5  rounded flex items-center gap-2.5 font-medium">
          {order.status}
          <div className="size-1.5 bg-[#FFA500] rounded-full" />
        </div>
      </div>
      <button
        className="text-left  min-[760px]:col-start-16   min-[960px]:col-start-21 min-[960px]:col-end-23 text-sm underline decoration-2 cursor-pointer  underline-offset-2"
        onClick={(e) => {
          e.stopPropagation();
          handleReserve();
        }}
      >
        Reservar
      </button>
    </li>
  );
}

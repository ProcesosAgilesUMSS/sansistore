import type { Order } from "../types";
import { STATUS_LABELS } from "../types";

interface OrderItemProps {
  order: Order;
  onViewDetail: () => void;
}

export default function OrderItem({ order, onViewDetail }: OrderItemProps) {
  return (
    <li
      onClick={onViewDetail}
      className="grid grid-cols-subgrid col-span-full border-b items-center py-[10px] min-[760px]:py-0 cursor-pointer hover:bg-[#dfdbd1]"
    >
      <div className="col-span-full min-[760px]:col-start-1 min-[760px]:col-end-3 text-sm flex items-center gap-[8px] text-xs">
        <div className="size-1.5 bg-[#1e1e1e]" />
        {order.id}
      </div>
      <div className="col-span-full min-[760px]:col-start-3 min-[760px]:col-end-14 text-[calc(.78125vw+14.5px)] truncate">
        {order.delivery.destination}
      </div>
      <div
        className="min-[760px]:col-start-15 min-[760px]:col-end-18 text-sm flex items-center"
        aria-label={`Estado: ${STATUS_LABELS[order.status]}`}
      >
        <div className="uppercase text-xs border border-[#1e1e1e44] p-[2px_5px_2.5px] border-dotted rounded flex items-center w-[13.5ch] justify-between">
          {STATUS_LABELS[order.status]}
          <div
            className={`size-2 rounded-full ${order.status === "delivered" ? "bg-green-700/80" : "bg-blue-700/80"}`}
          />
        </div>
      </div>
    </li>
  );
}

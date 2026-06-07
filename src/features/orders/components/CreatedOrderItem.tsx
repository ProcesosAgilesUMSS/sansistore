import type { Order } from "@features/orders/types";
import { formatCurrency } from "../utils/currency";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: Order;
  index: number;
  selectOrder: () => void
}

export default function CreatedOrderItem({ order, index, selectOrder }: Props) {
  return (
    <li
      onClick={selectOrder}
      className="grid grid-cols-subgrid col-span-full border-b border-dotted border-(--theme-border) py-3 hover:bg-(--theme-secondary-bg) cursor-pointer transition-colors items-center"
    >
      {/* Order ID */}
      <div className="col-span-full min-[570px]:col-start-1 min-[570px]:col-end-4 min-[775px]:col-end-3 flex items-center gap-x-2 text-sm font-mono">
        <div className="size-1.5 bg-(--theme-text) opacity-70 shrink-0" />
        ORD-{(index + 1).toString().padStart(3, '0')}
      </div>

      {/* Destination */}
      <div className="col-span-full min-[570px]:col-start-4 min-[570px]:col-end-16 min-[775px]:col-start-3 min-[775px]:col-end-12 min-[775px]:ml-4 min-[850px]:ml-0 text-sm uppercase truncate leading-[120%]">
        {order.address}
      </div>

      {/* Status */}
      <div className="col-span-full min-[570px]:col-start-16 min-[570px]:col-end-19 min-[775px]:col-start-13 min-[775px]:col-end-16 min-[850px]:col-start-12 min-[850px]:col-end-14 flex items-center gap-x-2 w-fit">
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Total */}
      <div className="hidden min-[775px]:flex min-[775px]:col-start-17 min-[775px]:col-end-19 min-[850px]:col-start-15 min-[850px]:col-end-17 items-center min-[850px]:ml-4 tabular-nums">
        {formatCurrency(order.total)}
      </div>

      {/* [VER] */}
      <div className="hidden min-[850px]:flex col-start-18 items-center justify-end">
        <button className="rounded-full border border-(--theme-border) px-3 py-1 text-[10px] uppercase font-600 text-(--theme-text) opacity-70 hover:opacity-100 transition-colors">
          Ver
        </button>
      </div>
    </li>
  );
}

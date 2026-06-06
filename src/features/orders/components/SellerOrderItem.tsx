import type { Order } from "@features/orders/types";
import { timeAgo } from "../utils/formatDate";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: Order;
  index: number;
  selectOrder: () => void
}

export default function SellerOrderItem({ order, index, selectOrder }: Props) {
  const updatedAt = timeAgo(order.updatedAt);

  return (
    <li
      onClick={selectOrder}
      className="grid grid-cols-subgrid col-span-full border-b border-black/20 hover:bg-black/5 cursor-pointer py-0.5"
    >
      <div className="col-span-full min-[765px]:col-start-1 min-[765px]:col-end-3  flex items-center gap-x-2 text-xs">
        <div className="size-2 bg-[#1e1e1e]" />
        ORD-{(index + 1).toString().padStart(3, '0')}
      </div>

      <div className="col-span-full min-[765px]:col-start-3 min-[765px]:col-end-11 truncate min-[965px]:col-end-9 uppercase">{order.address}</div>
      <div className="col-span-full min-[765px]:col-start-11 min-[765px]:col-end-16 min-[965px]:col-start-9 min-[965px]:col-end-13 min-[765px]:ml-2 min-[960px]:ml-10  flex gap-x-2 items-center text-sm">
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="hidden min-[965px]:inline col-start-13 col-end-16 ml-4 text-sm">{updatedAt}</div>
      <div className="hidden min-[765px]:inline min-[765px]:col-start-16 min-[765px]:col-end-19 min-[965px]:ml-4">{order.delivery?.courierName || "-"}</div>
    </li>
  )
}

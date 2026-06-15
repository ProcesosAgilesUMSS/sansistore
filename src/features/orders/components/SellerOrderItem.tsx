import type { Order } from "@features/orders/types";
import { parseOrderId } from "@/features/cart/services/orderService";
import { timeAgo } from "../utils/formatDate";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
	order: Order;
	selectOrder: () => void;
}

export default function SellerOrderItem({ order, selectOrder }: Props) {
	const updatedAt = timeAgo(order.updatedAt);

	return (
		<li
			role="presentation"
			className="grid grid-cols-subgrid col-span-full border-b border-dotted border-(--theme-border) items-center"
		>
			<button
				type="button"
				onClick={selectOrder}
				className="grid grid-cols-subgrid col-span-full hover:bg-(--theme-secondary-bg) transition-colors cursor-pointer py-3 items-center text-left w-full"
			>
				<div className="col-span-full min-[765px]:col-start-1 min-[765px]:col-end-3 text-sm font-mono truncate">
					{parseOrderId(order.id).friendlyName}
				</div>

				<div className="col-span-full min-[765px]:col-start-3 min-[765px]:col-end-11 truncate min-[965px]:col-end-9 uppercase text-sm min-[765px]:ml-6">
					{order.address}
				</div>
				<div className="col-span-full min-[765px]:col-start-11 min-[765px]:col-end-16 min-[965px]:col-start-9 min-[965px]:col-end-13 min-[765px]:ml-2 min-[960px]:ml-10 flex gap-x-2 items-center text-sm">
					<OrderStatusBadge status={order.status} />
				</div>

				<div className="hidden min-[965px]:inline col-start-13 col-end-16 ml-4 text-sm">
					{updatedAt}
				</div>
				<div className="hidden min-[765px]:inline min-[765px]:col-start-16 min-[765px]:col-end-19 min-[965px]:ml-4">
					{order.delivery?.courierName || "-"}
				</div>
			</button>
		</li>
	);
}

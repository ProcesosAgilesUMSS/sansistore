import type { Order } from "@features/orders/types";
import { parseOrderId } from "@/features/cart/services/orderService";
import { formatCurrency } from "../utils/currency";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
	order: Order;
	selectOrder: () => void;
}

export default function CreatedOrderItem({ order, selectOrder }: Props) {
	return (
		<li
			role="presentation"
			className="grid grid-cols-subgrid col-span-full border-b border-dotted border-(--theme-border) items-center"
		>
			<button
				type="button"
				onClick={selectOrder}
				className="grid grid-cols-subgrid col-span-full py-3 hover:bg-(--theme-secondary-bg) cursor-pointer transition-colors text-left w-full"
			>
				{/* Order ID */}
				<div className="col-span-full min-[570px]:col-start-1 min-[570px]:col-end-4 min-[775px]:col-end-3 text-sm font-mono truncate">
					{parseOrderId(order.id).friendlyName}
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
				<div className="hidden min-[850px]:flex col-start-18 items-center justify-end">
					<span className="rounded-full border border-(--theme-border) px-3 py-1 text-xs uppercase font-semibold text-(--theme-text) opacity-60 transition-colors">
						Ver
					</span>
				</div>
			</button>

			{/* [VER] */}
		</li>
	);
}

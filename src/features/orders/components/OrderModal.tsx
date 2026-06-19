import { parseOrderId } from "@features/cart/services/orderService";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Order } from "../types";
import { formatCurrency } from "../utils/currency";
import { formatOrderDate, timeAgo } from "../utils/formatDate";
import OrderActions from "./OrderActions";
import OrderStatusBadge from "./OrderStatusBadge";

type DetailColumn = "precio" | "monto" | "stock";

export default function OrderModal({
	order,
	closeModal,
	onNotification,
}: {
	order: Order;
	closeModal: () => void;
	onNotification?: (type: "success" | "error", message: string) => void;
}) {
	const [selectedCol, setSelectedCol] = useState<DetailColumn>("stock");
	const [showColSelector, setShowColSelector] = useState(false);

	const createdAt = formatOrderDate(order.createdAt);
	const updatedAt = timeAgo(order.updatedAt);
	const totalQuantity = order.items.reduce(
		(acc, item) => acc + item.quantity,
		0,
	);
	const formattedStatus =
		order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase();

	const columns: { id: DetailColumn; label: string }[] = [
		{ id: "monto", label: "Monto" },
		{ id: "precio", label: "Precio" },
		{ id: "stock", label: "Stock" },
	];

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-2">
			<button
				type="button"
				onClick={closeModal}
				className="absolute inset-0 cursor-default"
				aria-label="Cerrar modal"
			/>
			<div className="bg-(--theme-card-bg) border border-(--theme-border) text-(--theme-text) max-w-2xl w-full px-6 py-6 rounded-2xl flex flex-col max-h-[90vh] overflow-y-auto relative shadow-2xl">
				<div className="flex gap-x-8 items-center mb-2">
					<span className="tracking-tight text-3xl font-display font-black">
						{parseOrderId(order.id).friendlyName}
					</span>
					<div className="flex gap-x-2 items-center">
						<OrderStatusBadge status={order.status} />
					</div>
				</div>

				{/*INFORMATION*/}
				<div className="grid grid-cols-20 my-4 gap-y-1 text-sm">
					<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60">
						Cliente:
					</div>
					<div className="leading-[140%] col-start-7  min-[765px]:col-start-5 col-end-21">
						{order.buyerName}
					</div>

					{/* INFO EXTRA CLIENTE */}
					{order.buyerInstitutionalId && (
						<>
							<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60">
								Carnet:
							</div>
							<div className="leading-[140%] col-start-7  min-[765px]:col-start-5 col-end-21">
								{order.buyerInstitutionalId}
							</div>
						</>
					)}
					{order.buyerPhoneNumber && (
						<>
							<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60">
								Teléfono:
							</div>
							<div className="leading-[140%] col-start-7  min-[765px]:col-start-5 col-end-21">
								{order.buyerPhoneNumber}
							</div>
						</>
					)}

					<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60">
						Creado:
					</div>
					<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">
						{createdAt}
					</div>
					<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60">
						Destino:
					</div>
					<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">
						{order.address}
					</div>
					<div className="leading-[140%] col-start-1 col-end-5 text-(--theme-text) opacity-60 capitalize truncate">
						{formattedStatus}:
					</div>
					<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">
						{updatedAt}
					</div>
					{order.incidentReason && (
						<>
							<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60 capitalize mt-2">
								Incidente
							</div>
							<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate text-(--theme-error) mt-2">
								{order.incidentReason}
							</div>

							{order.incidentNotes && (
								<>
									<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60 capitalize">
										Nota:
									</div>
									<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate italic opacity-60">
										{order.incidentNotes}
									</div>
								</>
							)}
						</>
					)}

					{order.delivery && (
						<>
							<div className="leading-[140%] col-start-1 col-end-5 text-(--theme-text) opacity-60 mt-2">
								Repartidor:
							</div>
							<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 mt-2">
								{order.delivery.courierName}
							</div>
							<div className="leading-[140%] col-start-1 col-end-5 text-(--theme-text) opacity-60">
								Asignado:
							</div>
							<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">
								{timeAgo(order.delivery.assignedAt)}
							</div>
							{order.delivery.incidentReason && (
								<>
									<div className="leading-[140%] col-start-1 col-end-5 text-(--theme-text) opacity-60 mt-2">
										Incidente:
									</div>
									<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 text-(--theme-error) mt-2">
										{order.delivery.incidentReason}
									</div>
									{order.delivery.incidentNotes && (
										<>
											<div className="leading-[140%] col-start-1 col-end-4 text-(--theme-text) opacity-60 capitalize">
												Nota:
											</div>
											<div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate italic opacity-60">
												{order.delivery.incidentNotes}
											</div>
										</>
									)}
								</>
							)}
						</>
					)}
				</div>

				<div className="grid grid-cols-20">
					<div className="col-span-full grid grid-cols-subgrid py-3 border-y border-dotted border-(--theme-border) mt-2 text-[10px] uppercase tracking-widest opacity-60">
						<div className="col-start-1 col-end-3">Cant.</div>
						<div className="col-start-4 col-end-13 min-[570px]:col-start-3 min-[570px]:col-end-10">
							Producto
						</div>

						{/* Desktop columns */}
						<div className="hidden min-[570px]:block col-start-13 col-end-16">
							Precio
						</div>
						<div className="hidden min-[570px]:block col-start-16 col-end-18">
							Monto
						</div>
						<div className="hidden min-[570px]:block col-start-19 col-end-21 text-center">
							Stock
						</div>

						{/* Mobile dynamic column */}
						<div className="min-[570px]:hidden col-start-18 col-end-21 relative cursor-pointer">
							<button
								type="button"
								onClick={() => setShowColSelector(!showColSelector)}
								className="flex items-center gap-1 w-full justify-end pr-3"
							>
								{columns.find((c) => c.id === selectedCol)?.label}
								<ChevronDown size={14} />
							</button>

							{showColSelector && (
								<div className="absolute right-0 top-full border border-(--theme-border) shadow-xl rounded-2xl z-[100] min-w-[150px] bg-(--theme-card-bg) mt-1 p-1">
									{columns.map((col) => (
										<button
											type="button"
											key={col.id}
											className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-(--theme-secondary-bg) ${
												selectedCol === col.id
													? "bg-(--theme-secondary-bg) text-primary"
													: "text-(--theme-text)"
											}`}
											onClick={() => {
												setSelectedCol(col.id);
												setShowColSelector(false);
											}}
										>
											{col.label}
											{selectedCol === col.id && (
												<Check size={14} className="text-primary" />
											)}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					<ul className="col-span-full grid grid-cols-subgrid py-2">
						{order.items.map((item) => (
							<li
								key={item.productId}
								className="col-span-full grid grid-cols-subgrid leading-[140%] items-center"
							>
								<div className="col-start-1 col-end-3 text-center">
									{item.quantity}
								</div>
								<div className="col-start-4 col-end-17 min-[570px]:col-start-3 min-[570px]:col-end-13 truncate">
									{item.productName}
								</div>

								{/* Desktop view */}
								<div className="hidden min-[570px]:block col-start-13 col-end-16">
									{formatCurrency(item.unitPrice)}
								</div>
								<div className="hidden min-[570px]:block col-start-16 col-end-19">
									{formatCurrency(item.subtotal)}
								</div>
								<div className="hidden min-[570px]:block col-start-19 col-end-21 text-center">
									{item.stockAvailable}
								</div>

								{/* Mobile view dynamic data */}
								<div
									className={`min-[570px]:hidden col-start-17 col-end-21 ml-0.5 ${selectedCol === "stock" ? "text-center" : "text-left"}`}
								>
									{selectedCol === "monto" && formatCurrency(item.subtotal)}
									{selectedCol === "precio" && formatCurrency(item.unitPrice)}
									{selectedCol === "stock" && item.stockAvailable}
								</div>
							</li>
						))}
					</ul>
				</div>

				<div className="py-4 border-y border-dotted border-(--theme-border) mt-2 text-sm">
					<div className="flex justify-between items-center leading-[130%] mb-2">
						<div className="text-(--theme-text) opacity-60">
							Número de artículos:
						</div>
						<div className="font-medium">{totalQuantity}</div>
					</div>

					<div className="flex justify-between items-baseline leading-[130%]">
						<div className="text-(--theme-text) opacity-60">Total:</div>
						<div className="tracking-tight text-xl font-800">
							{formatCurrency(order.total)}
						</div>
					</div>
				</div>

				<div className="mt-2">
					<OrderActions
						order={order}
						onSuccess={closeModal}
						onNotification={onNotification}
					/>
				</div>
			</div>
		</div>
	);
}

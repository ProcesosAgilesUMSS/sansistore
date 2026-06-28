import Toast from "@features/admin/users/components/Toast";
import type { Order, OrderStatus } from "@features/orders/types";
import { STATUS_LABELS } from "@features/orders/types";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "../../../hooks/useAuthUser";
import { SectionHeader } from "../../seller/components/SectionHeader";
import { subscribeToSellerOrders } from "../services/ordersService";
import { ClosedFolderIcon, OpenFolderIcon } from "./Icons";
import OrderModal from "./OrderModal";
import OrderStatusBadge from "./OrderStatusBadge";
import SellerOrderItem from "./SellerOrderItem";

export default function Orders() {
	const { user } = useAuthUser();
	const [orders, setOrders] = useState<Order[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [showFilters, setShowFilters] = useState<boolean>(false);
	const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);
	const filterRef = useRef<HTMLDivElement>(null);

	const showNotification = (type: "success" | "error", message: string) => {
		setToast({ message, type });
	};

	useEffect(() => {
		if (!user) return;

		const unsubscribe = subscribeToSellerOrders(user.uid, (newOrders) => {
			setOrders(newOrders);
			setLoading(false);
		});

		return () => unsubscribe();
	}, [user]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				filterRef.current &&
				!filterRef.current.contains(event.target as Node)
			) {
				setShowFilters(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const filteredOrders = useMemo(() => {
		if (selectedStatuses.length === 0) return orders;
		return orders.filter((order) => selectedStatuses.includes(order.status));
	}, [orders, selectedStatuses]);

	const toggleStatus = (status: OrderStatus) => {
		setSelectedStatuses((prev) =>
			prev.includes(status)
				? prev.filter((s) => s !== status)
				: [...prev, status],
		);
	};

	if (loading) return null;

	return (
		<>
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
			{selectedOrder ? (
				<OrderModal
					order={selectedOrder}
					closeModal={() => setSelectedOrder(null)}
					onNotification={showNotification}
				/>
			) : null}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
				<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
					<SectionHeader title="Mis pedidos" count={filteredOrders.length} />

					<div className="relative mb-8 w-full border-b border-dotted border-(--theme-border) pb-4">
						<div ref={filterRef} className="w-fit">
							<button
								type="button"
								className="flex items-center gap-x-2 text-sm font-medium w-fit cursor-pointer text-(--theme-text) opacity-60 hover:opacity-100 transition-opacity"
								onClick={() => setShowFilters(!showFilters)}
							>
								{showFilters ? <ClosedFolderIcon /> : <OpenFolderIcon />}
								Filtrar por estado
							</button>

							{selectedStatuses.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3 text-xs w-full items-center">
									{selectedStatuses.map((status) => (
										<button
											type="button"
											key={status}
											className="flex items-center gap-x-2 bg-(--theme-secondary-bg) border border-(--theme-border) hover:brightness-95 cursor-pointer px-2.5 py-1 rounded-full text-(--theme-text)"
											onClick={() => toggleStatus(status)}
										>
											<X size={13} />
											<span>{STATUS_LABELS[status]}</span>
										</button>
									))}
								</div>
							)}

							{showFilters && (
								<div className="bg-(--theme-card-bg) border border-(--theme-border) shadow-xl rounded-2xl p-2 absolute z-10 w-[24ch] max-h-[250px] overflow-y-auto top-full mt-2">
									{(Object.entries(STATUS_LABELS) as [OrderStatus, string][])
										.filter(([status]) => status !== "CREADO")
										.map(([status]) => (
											<button
												type="button"
												key={status}
												onClick={() => {
													toggleStatus(status);
													setShowFilters(false);
												}}
												className={`flex text-xs gap-x-2 cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-(--theme-secondary-bg) w-full ${selectedStatuses.includes(status as OrderStatus) ? "bg-(--theme-secondary-bg)" : ""}`}
											>
												<OrderStatusBadge status={status} />
											</button>
										))}
								</div>
							)}
						</div>
					</div>

					<ul className="grid grid-cols-18 mx-auto w-full">
						<li className="hidden min-[765px]:grid grid-cols-subgrid col-span-full uppercase border-b border-dotted border-(--theme-border) pb-3 mb-1 text-xs tracking-widest font-normal opacity-60">
							<div className="flex gap-x-2">
								<span>/</span>
								Orden
							</div>
							<div className="flex gap-x-2 min-[765px]:col-start-3 min-[765px]:col-end-7 min-[765px]:ml-6">
								<span>/</span>
								Destino
							</div>
							<div className="flex gap-x-2 min-[765px]:col-start-11 min-[765px]:col-end-13  min-[765px]:ml-2 min-[965px]:col-start-9 min-[965px]:col-end-13 min-[960px]:ml-10">
								<span>/</span>
								Estado
							</div>

							<div className="ml-4 hidden gap-x-2 min-[965px]:flex min-[965px]:col-start-13 min-[965px]:col-end-16">
								<span>/</span>
								Actualizado
							</div>

							<div className="flex gap-x-2 min-[765px]:col-start-16 min-[765px]:col-end-19">
								<span>/</span>
								Asignado a
							</div>
						</li>

						{filteredOrders.map((order) => (
							<SellerOrderItem
								key={order.id}
								order={order}
								selectOrder={() => setSelectedOrder(order)}
							/>
						))}
					</ul>
				</section>
			</div>
		</>
	);
}

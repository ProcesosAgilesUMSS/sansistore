import Toast from "@features/admin/users/components/Toast";
import { subscribeToCreatedOrders } from "@features/orders/services/ordersService";
import type { Order } from "@features/orders/types";
import { useEffect, useState } from "react";
import { SectionHeader } from "../../seller/components/SectionHeader";
import CreatedOrderItem from "./CreatedOrderItem";
import OrderModal from "./OrderModal";

export default function CreatedOrdersList() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	const showNotification = (type: "success" | "error", message: string) => {
		const allowedMessages = [
			"Pedido marcado como listo.",
			"Pago validado correctamente.",
		];
		if (type === "success" && !allowedMessages.includes(message)) return;
		setToast({ message, type });
	};

	useEffect(() => {
		const unsubscribe = subscribeToCreatedOrders((data) => {
			setOrders(data);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

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
					<SectionHeader title="Pedidos creados" count={orders.length} />
					<ul className="grid grid-cols-18 mx-auto w-full">
						{/* Header */}
						<li className="grid grid-cols-subgrid col-span-full uppercase border-b border-dotted border-(--theme-border) pb-3 mb-1 text-xs tracking-widest font-normal opacity-60">
							<div className="hidden min-[570px]:flex col-span-full min-[570px]:col-start-1 min-[570px]:col-end-4 min-[775px]:col-end-3 gap-x-2">
								<span>/</span>
								Orden
							</div>
							<div className="hidden min-[570px]:flex gap-x-2 min-[570px]:col-start-4 min-[570px]:col-end-16 min-[775px]:col-start-3 min-[775px]:col-end-12 min-[775px]:ml-4 min-[850px]:ml-0">
								<span>/</span>
								Destino
							</div>
							<div className="hidden min-[570px]:flex gap-x-2 min-[570px]:col-start-16 min-[570px]:col-end-19 min-[775px]:col-start-13 min-[775px]:col-end-16 min-[850px]:col-start-12 min-[850px]:col-end-14">
								<span>/</span>
								Estado
							</div>
							<div className="hidden min-[775px]:flex gap-x-2 min-[775px]:col-start-17 min-[775px]:col-end-19 min-[850px]:col-start-15 min-[850px]:col-end-17 min-[850px]:ml-4">
								<span>/</span>
								Total
							</div>
						</li>

						{orders.map((order) => (
							<CreatedOrderItem
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

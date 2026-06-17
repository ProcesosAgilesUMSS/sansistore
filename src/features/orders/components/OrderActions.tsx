import { useAssignOrdersToDelivery } from "@features/seller/hooks/useAssignOrdersToDelivery";
import { useGetMessengers } from "@features/seller/hooks/useGetMessengers";
import { UserRound } from "lucide-react";
import { useState } from "react";
import {
	cancelOrder,
	markOrderAsPaid,
	paidOrder,
	readyOrder,
	reserveOrder,
	returnOrder,
} from "../services/ordersService";
import type { Order } from "../types";

const ACTIONS = {
	EMPAQUETADO: {
		label: "Marcar como listo",
		color: "bg-primary",
		handler: readyOrder,
		successMsg: "Pedido marcado como listo.",
	},
	CREADO: {
		label: "Reservar",
		color: "bg-primary",
		handler: reserveOrder,
		successMsg: "Pedido reservado con éxito.",
	},
	"NO ENTREGADO": {
		label: "Devolver orden",
		color: "bg-(--theme-warning)",
		handler: returnOrder,
		successMsg: "Orden devuelta.",
	},
	ENTREGADO: {
		label: "Validar pago",
		color: "bg-primary",
		handler: paidOrder,
		successMsg: "Pago validado correctamente.",
	},
} as const;

const PAYMENT_VALIDATED_STATUSES = new Set([
	"pagado",
	"paid",
	"validado",
	"verified",
]);

function normalizeStatus(value: unknown): string {
	return String(value ?? "")
		.trim()
		.toLowerCase();
}

function isPaymentValidated(order: Order): boolean {
	return (
		normalizeStatus(order.status) === "pagado" ||
		PAYMENT_VALIDATED_STATUSES.has(normalizeStatus(order.paymentStatus))
	);
}

function canValidatePayment(order: Order): boolean {
	const orderStatus = normalizeStatus(order.status);
	const deliveryStatus = normalizeStatus(order.deliveryStatus);
	const isDeliveredOrCompleted =
		orderStatus === "entregado" ||
		orderStatus === "completado" ||
		deliveryStatus === "delivered";

	return isDeliveredOrCompleted && !isPaymentValidated(order);
}

export default function OrderActions({
	order,
	onSuccess,
	onNotification,
}: {
	order: Order;
	onSuccess?: () => void;
	onNotification?: (type: "success" | "error", message: string) => void;
}) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

	const handleAction = async (
		action: () => Promise<void>,
		successMsg?: string,
	) => {
		setIsSubmitting(true);
		try {
			await action();
			if (successMsg) onNotification?.("success", successMsg);

			onSuccess?.();
		} catch (error) {
			console.error("Error al ejecutar la acción:", error);
			onNotification?.("error", "Error al ejecutar la acción.");
		} finally {
			setIsSubmitting(false);
			setShowPaymentConfirm(false);
		}
	};

	if (order.status === "RESERVADO") {
		return <CancelOrderSection order={order} onSuccess={onSuccess} />;
	}

	if (order.status === "LISTO") {
		return (
			<ReadyOrderSection
				order={order}
				onSuccess={onSuccess}
				onNotification={onNotification}
			/>
		);
	}

	if (order.status === "RECHAZADO") {
		return (
			<RejectedOrderSection
				order={order}
				onSuccess={onSuccess}
				onNotification={onNotification}
			/>
		);
	}

	const showPaymentValidation = canValidatePayment(order);
	const config = showPaymentValidation
		? ACTIONS.ENTREGADO
		: ACTIONS[order.status as keyof typeof ACTIONS];
	if (!config) return null;

	return (
		<div className="text-right">
			<button
				type="button"
				className={`text-white rounded-full font-semibold px-5 py-2.5 text-sm ${config.color} cursor-pointer transition hover:opacity-90 disabled:opacity-50`}
				onClick={() => {
					if (showPaymentValidation) {
						setShowPaymentConfirm(true);
					} else {
						handleAction(() => config.handler(order.id), config.successMsg);
					}
				}}
				disabled={isSubmitting}
			>
				{isSubmitting ? "Procesando..." : config.label}
			</button>

			{showPaymentConfirm && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-[28px] bg-(--theme-card-bg) border border-(--theme-border) p-6 shadow-2xl text-left text-(--theme-text)">
						<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
							<span className="text-xl font-bold">$</span>
						</div>
						<h3 className="text-[1.6rem] font-semibold text-(--theme-text)">
							Validar pago del pedido
						</h3>
						<p className="mt-3 text-[1rem] leading-7 text-(--theme-text) opacity-70">
							Este pedido se marcará como pagado y se actualizará el inventario.
						</p>
						<div className="mt-5 rounded-2xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) opacity-60">
							Esta acción no se puede deshacer.
						</div>
						<div className="mt-7 flex gap-3">
							<button
								type="button"
								onClick={() => setShowPaymentConfirm(false)}
								className="flex-1 rounded-full border border-(--theme-border) px-5 py-3 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg)"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() =>
									handleAction(
										() => paidOrder(order.id),
										ACTIONS.ENTREGADO.successMsg,
									)
								}
								disabled={isSubmitting}
								className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
							>
								{isSubmitting ? "Validando..." : "Confirmar"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function CancelOrderSection({
	order,
	onSuccess,
}: {
	order: Order;
	onSuccess?: () => void;
}) {
	const [showCancelForm, setShowCancelForm] = useState(false);
	const [incidentNotes, setIncidentNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleCancel = async () => {
		if (!incidentNotes.trim()) {
			alert("Por favor, ingresa el motivo de la cancelación en las notas.");
			return;
		}

		setIsSubmitting(true);
		try {
			await cancelOrder(
				order.id,
				"Reserva cancelada por vendedor",
				incidentNotes,
			);
			setShowCancelForm(false);
			onSuccess?.();
		} catch (error) {
			console.error("Error al cancelar la orden:", error);
			alert("Error al cancelar la orden.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (showCancelForm) {
		return (
			<div className="flex flex-col gap-2 mt-2">
				<textarea
					className="w-full p-2 border border-(--theme-border) bg-(--theme-bg) text-(--theme-text) rounded-xl text-sm outline-none focus:border-primary transition-colors"
					placeholder="Escribe el motivo de la cancelación..."
					value={incidentNotes}
					onChange={(e) => setIncidentNotes(e.target.value)}
					rows={3}
				/>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						className="px-4 py-2 text-sm text-(--theme-text) opacity-60 hover:opacity-100 hover:bg-(--theme-secondary-bg) border border-(--theme-border) rounded-full transition-colors"
						onClick={() => setShowCancelForm(false)}
						disabled={isSubmitting}
					>
						Cerrar
					</button>
					<button
						type="button"
						className="text-white rounded-full px-4 py-2 bg-(--theme-danger) text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
						onClick={handleCancel}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Cancelando..." : "Confirmar cancelación"}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="text-right">
			<button
				type="button"
				className="text-white rounded-full tracking-tight px-5 py-2.5 bg-(--theme-danger) text-sm font-semibold transition hover:opacity-90 cursor-pointer"
				onClick={() => setShowCancelForm(true)}
			>
				Cancelar orden
			</button>
		</div>
	);
}

function RejectedOrderSection({
	order,
	onSuccess,
	onNotification,
}: {
	order: Order;
	onSuccess?: () => void;
	onNotification?: (type: "success" | "error", message: string) => void;
}) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleDeny = async () => {
		setIsSubmitting(true);
		try {
			await markOrderAsPaid(order.id);
			onNotification?.("success", "Orden marcada como pagada.");
			onSuccess?.();
		} catch (error) {
			console.error("Error al denegar rechazo:", error);
			onNotification?.("error", "Error al procesar la acción.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRefund = async () => {
		setIsSubmitting(true);
		try {
			await returnOrder(order.id);
			onNotification?.(
				"success",
				"Dinero devuelto y orden marcada como devuelta.",
			);
			onSuccess?.();
		} catch (error) {
			console.error("Error al devolver dinero:", error);
			onNotification?.("error", "Error al procesar la devolución de dinero.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex justify-end gap-2">
			<button
				type="button"
				onClick={handleRefund}
				disabled={isSubmitting}
				className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg) cursor-pointer disabled:opacity-50"
			>
				{isSubmitting ? "Procesando..." : "Devolver dinero"}
			</button>
			<button
				type="button"
				onClick={handleDeny}
				disabled={isSubmitting}
				className="rounded-full bg-(--theme-danger) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
			>
				{isSubmitting ? "Procesando..." : "Denegar"}
			</button>
		</div>
	);
}

function ReadyOrderSection({
	order,
	onSuccess,
	onNotification,
}: {
	order: Order;
	onSuccess?: () => void;
	onNotification?: (type: "success" | "error", message: string) => void;
}) {
	const { messengers, loading: messengersLoading } = useGetMessengers();
	const { assingToDelivery, isLoading: assignLoading } =
		useAssignOrdersToDelivery();
	const [showList, setShowList] = useState(false);
	const [selectedCourierId, setSelectedCourierId] = useState<string | null>(
		null,
	);

	const handleConfirm = async () => {
		if (!selectedCourierId) return;
		try {
			await assingToDelivery(order.id, selectedCourierId);
			onNotification?.("success", "Mensajero asignado correctamente.");
			onSuccess?.();
		} catch {
			onNotification?.("error", "Error al asignar el mensajero.");
		}
	};

	if (!showList) {
		return (
			<div className="text-right">
				<button
					type="button"
					onClick={() => setShowList(true)}
					className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
				>
					Asignar mensajero
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 mt-2">
			{messengersLoading ? (
				<div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50 text-center">
					Cargando mensajeros…
				</div>
			) : messengers.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50 text-center">
					No hay mensajeros disponibles.
				</div>
			) : (
				<div className="grid gap-2">
					{messengers.map((messenger) => {
						const isSelected = selectedCourierId === messenger.uid;
						return (
							<button
								key={messenger.uid}
								type="button"
								onClick={() => setSelectedCourierId(messenger.uid)}
								className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:border-primary hover:bg-(--theme-secondary-bg) ${
									isSelected
										? "border-primary bg-primary/10 text-primary"
										: "border-(--theme-border) bg-(--theme-card-bg) text-(--theme-text)"
								}`}
							>
								<div className="flex items-center gap-3">
									<span
										className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
											isSelected
												? "bg-primary text-white"
												: "bg-(--theme-secondary-bg) text-(--theme-text)"
										}`}
									>
										<UserRound size={15} />
									</span>
									<div>
										<p className="font-semibold text-sm">
											{messenger.displayName}
										</p>
										<p className="text-xs opacity-55">
											{messenger.institutionalId || "Sin CI institucional"}
										</p>
									</div>
								</div>
								<span className="text-xs font-semibold opacity-70">
									{isSelected ? "Seleccionado" : "Elegir"}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<div className="flex justify-end gap-2">
				<button
					type="button"
					onClick={() => {
						setShowList(false);
						setSelectedCourierId(null);
					}}
					disabled={assignLoading}
					className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg) cursor-pointer disabled:opacity-50"
				>
					Cancelar
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					disabled={!selectedCourierId || assignLoading}
					className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
				>
					{assignLoading ? "Asignando…" : "Confirmar asignación"}
				</button>
			</div>
		</div>
	);
}

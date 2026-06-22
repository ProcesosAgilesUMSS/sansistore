import { UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parseOrderId } from "@/features/cart/services/orderService";
import { db } from "../../../lib/firebase";
import { fetchDeliveryData } from "../services/sellerServices";
import type { Messenger, Order } from "../types";
import { ErrorMessage } from "./ErrorMessage";

interface Props {
	order: Order;
	messengers: Messenger[];
	selectedCourierId?: string;
	messengersLoading: boolean;
	isLoading: boolean;
	onSelectCourier: (orderId: string, courierId: string) => void;
	onConfirm: () => void;
	onClose: () => void;
}

export function ReassignModal({
	order,
	messengers,
	selectedCourierId,
	messengersLoading,
	isLoading,
	onSelectCourier,
	onConfirm,
	onClose,
}: Props) {
	const [rejectingCourierId, setRejectingCourierId] = useState<string | null>(
		null,
	);
	const [rejectingCourierName, setRejectingCourierName] = useState<
		string | null
	>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			if (!order.deliveryId) {
				setError("El pedido no tiene un ID de entrega asociado.");
				return;
			}
			try {
				const d = await fetchDeliveryData(db, order.deliveryId);
				if (!mounted) return;
				setRejectingCourierId(d?.courierId ?? null);
				setRejectingCourierName(d?.deliveryCourierName ?? null);
			} catch {
				setError("No se pudo obtener la información de la entrega");
			}
		})();

		return () => {
			mounted = false;
		};
	}, [order.deliveryId]);

	const availableCount = messengers.filter(
		(m) => m.isAvailable && m.uid !== rejectingCourierId,
	).length;

	return createPortal(
		<div
			className="fixed inset-0 z-999 flex items-start justify-center overflow-y-auto bg-black/75 p-2 backdrop-blur-md sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="reassign-messenger-title"
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
			tabIndex={-1}
		>
			<section className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-(--theme-border) bg-(--theme-card-bg) shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
				<header className="flex shrink-0 items-start justify-between gap-3 border-b border-(--theme-border) px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
					<div className="min-w-0">
						<h2
							id="reassign-messenger-title"
							className="font-display text-xl font-bold leading-tight tracking-tight text-(--theme-text) sm:mt-2 sm:text-2xl"
						>
							{parseOrderId(order.orderId).friendlyName}
						</h2>
						<p className="mt-1 text-sm leading-snug text-(--theme-text) opacity-70">
							Selecciona un mensajero disponible. El que rechazó no puede ser
							seleccionado.
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) transition hover:border-primary hover:text-primary"
						aria-label="Cerrar modal"
					>
						<X size={18} />
					</button>
				</header>

				{error && <ErrorMessage message={error} />}

				<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
					<div className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 p-4">
						<p className="text-[11px] font-800 uppercase tracking-[0.24em] text-(--theme-text) opacity-45">
							Pedido pendiente
						</p>
						<p className="mt-1 text-lg font-900 text-(--theme-text)">
							{order.buyerName ?? "Comprador desconocido"}
						</p>
						<p className="mt-1 text-sm text-(--theme-text) opacity-70">
							{order.locationLabel ?? "Ubicación no registrada"}
						</p>
					</div>

					{rejectingCourierName && (
						<div className="mt-4 rounded-2xl border border-dashed border-(--theme-border) px-4 py-4 text-sm text-(--theme-text) opacity-80">
							<p className="text-xs font-800 opacity-60">
								Mensajero que rechazó
							</p>
							<p className="mt-1 font-700">{rejectingCourierName}</p>
						</div>
					)}

					{!messengersLoading && messengers.length > 0 && (
						<p className="mt-4 text-xs text-(--theme-text) opacity-50">
							{availableCount} de {messengers.length} mensajeros disponibles
							para reasignar
						</p>
					)}

					<div className="mt-3 grid gap-3">
						{messengersLoading ? (
							<div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">
								Cargando mensajeros…
							</div>
						) : messengers.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">
								No hay mensajeros registrados.
							</div>
						) : availableCount === 0 ? (
							<div className="rounded-2xl border border-dashed border-warning-border bg-warning-bg px-4 py-6 text-sm text-warning">
								No hay mensajeros disponibles para reasignar en este momento.
							</div>
						) : (
							messengers.map((messenger) => {
								const isRejecting = messenger.uid === rejectingCourierId;
								const isBusy = !messenger.isAvailable;
								const isDisabled = isRejecting || isBusy || !!error;
								const isSelected = selectedCourierId === messenger.uid;

								return (
									<button
										key={messenger.uid}
										type="button"
										onClick={() =>
											!isDisabled &&
											onSelectCourier(order.orderId, messenger.uid)
										}
										disabled={isDisabled}
										className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
											isDisabled
												? "cursor-not-allowed border-(--theme-border) bg-(--theme-secondary-bg)/40 opacity-50"
												: isSelected
													? "border-primary bg-primary/10 text-primary hover:border-primary hover:bg-(--theme-secondary-bg)"
													: "border-(--theme-border) bg-(--theme-card-bg) text-(--theme-text) hover:border-primary hover:bg-(--theme-secondary-bg)"
										}`}
									>
										<div className="flex items-center gap-3">
											<span
												className={`flex h-10 w-10 items-center justify-center rounded-full ${
													isSelected && !isDisabled
														? "bg-primary text-primary-action"
														: "bg-(--theme-secondary-bg)"
												}`}
											>
												<UserRound aria-hidden="true" size={16} />
											</span>
											<div>
												<p className="font-800 flex items-center gap-2">
													{messenger.displayName}
													{!isRejecting && (
														<span
															className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide border ${
																messenger.isAvailable
																	? "bg-success-bg text-success border-success-border"
																	: "bg-danger-bg text-danger border-danger-border"
															}`}
														>
															{messenger.isAvailable ? "Disponible" : "Ocupado"}
														</span>
													)}
												</p>
												<p className="text-xs opacity-55">
													{messenger.institutionalId || "Sin CI institucional"}
												</p>
											</div>
										</div>

										<span className="text-sm font-semibold opacity-70">
											{isRejecting
												? "Rechazó"
												: isBusy
													? ""
													: isSelected
														? "Seleccionado"
														: "Elegir"}
										</span>
									</button>
								);
							})
						)}
					</div>

					<div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t border-(--theme-border) bg-(--theme-card-bg) px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-50"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={
								!selectedCourierId || isLoading || messengersLoading || !!error
							}
							className="rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-primary-action transition hover:opacity-90 disabled:opacity-50"
						>
							{isLoading ? "Reasignando…" : "Confirmar reasignación"}
						</button>
					</div>
				</div>
			</section>
		</div>,
		document.body,
	);
}

export default ReassignModal;

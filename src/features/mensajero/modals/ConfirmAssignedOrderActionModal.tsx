import {
	AlertTriangle,
	CheckCircle2,
	LoaderCircle,
	PackageCheck,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { parseOrderId } from "../../cart/services/orderService";
import type { MessengerOrder } from "../types";
import { formatBolivianos } from "../utils/money";

type AssignedOrderAction = "accept" | "reject";

interface ConfirmAssignedOrderActionModalProps {
	order: MessengerOrder;
	action: AssignedOrderAction;
	isSaving: boolean;
	onClose: () => void;
	onConfirm: (reason?: string) => Promise<void>;
}

const actionConfig = {
	accept: {
		title: "Aceptar pedido asignado",
		description:
			"Confirma que tomarás este pedido para continuar con la entrega.",
		buttonLabel: "Confirmar",
		Icon: CheckCircle2,
		iconClassName: "bg-primary/15 text-primary",
		buttonClassName: "bg-primary text-primary-action hover:opacity-90",
		warning:
			"El pedido pasará a Pedidos aceptados y quedará bajo tu responsabilidad.",
	},
	reject: {
		title: "Rechazar pedido asignado",
		description: "Confirma que no podrás atender este pedido asignado.",
		buttonLabel: "Confirmar",
		Icon: XCircle,
		iconClassName: "bg-(--theme-error-bg) text-(--theme-error)",
		buttonClassName: "bg-(--theme-error) text-(--theme-bg) hover:opacity-90",
		warning:
			"El pedido quedará pendiente de reasignación para que el vendedor seleccione otro mensajero.",
	},
} satisfies Record<
	AssignedOrderAction,
	{
		title: string;
		description: string;
		buttonLabel: string;
		Icon: typeof CheckCircle2;
		iconClassName: string;
		buttonClassName: string;
		warning: string;
	}
>;

const rejectionReasons = [
	"No estoy en el campus indicado",
	"No puedo atender en este horario",
	"No tengo acceso al edificio o area",
	"Ubicacion del pedido incompleta",
	"Entrega fuera de mi recorrido actual",
	"Otro motivo",
];

export type { AssignedOrderAction };

export default function ConfirmAssignedOrderActionModal({
	order,
	action,
	isSaving,
	onClose,
	onConfirm,
}: ConfirmAssignedOrderActionModalProps) {
	const config = actionConfig[action];
	const { friendlyName } = parseOrderId(order.id);
	const displayId = order.displayId ?? friendlyName;
	const Icon = config.Icon;

	const [reason, setReason] = useState("");
	const [customReason, setCustomReason] = useState("");
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [errorModal, setErrorModal] = useState<string | null>(null);

	const confirmAction = async () => {
		if (isSaving) return;

		// Validar motivo solo para rechazo
		if (action === "reject") {
			const finalReason = reason === "Otro motivo" ? customReason : reason;
			if (!finalReason.trim()) {
				setErrorModal(
					"Debes seleccionar o escribir un motivo para rechazar el pedido.",
				);
				return;
			}
			await onConfirm(finalReason);
		} else {
			await onConfirm();
		}
	};

	const handleReasonSelect = (selectedReason: string) => {
		setReason(selectedReason);
		setShowCustomInput(selectedReason === "Otro motivo");
		if (selectedReason !== "Otro motivo") {
			setCustomReason("");
		}
	};

	const isRejectAction = action === "reject";

	return (
		<>
			<div
				className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/65 p-2 backdrop-blur-sm sm:p-4"
				onClick={(event) => {
					if (event.target === event.currentTarget) onClose();
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") onClose();
				}}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-labelledby="assigned-order-action-title"
			>
				<section className="my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-card-bg-light text-text-light shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
					<header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-light px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
						<div className="flex min-w-0 items-center gap-3 sm:gap-4">
							<span
								className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${config.iconClassName}`}
							>
								<Icon size={24} />
							</span>

							<div className="min-w-0">
								<h2
									className="text-lg font-black leading-tight tracking-normal sm:text-xl"
									id="assigned-order-action-title"
								>
									{config.title}
								</h2>
								<p className="text-sm font-medium leading-snug opacity-70">
									{config.description}
								</p>
							</div>
						</div>

						<button
							aria-label="Cerrar"
							className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
							disabled={isSaving}
							onClick={onClose}
							type="button"
						>
							<X size={16} />
						</button>
					</header>

					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
						<div className="grid gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 sm:grid-cols-2">
							<div>
								<p className="text-xs font-bold uppercase opacity-50">Pedido</p>
								<p className="mt-1 text-sm font-bold">{displayId}</p>
							</div>

							<div>
								<p className="text-xs font-bold uppercase opacity-50">
									Cliente
								</p>
								<p className="mt-1 text-sm font-bold">{order.customerName}</p>
							</div>

							<div>
								<p className="text-xs font-bold uppercase opacity-50">Zona</p>
								<p className="mt-1 text-sm font-bold">{order.city}</p>
							</div>

							<div>
								<p className="text-xs font-bold uppercase opacity-50">
									Monto a cobrar
								</p>
								<p className="mt-1 text-sm font-bold">
									{formatBolivianos(order.cashToCollect)}
								</p>
							</div>
						</div>

						<div className="flex gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 text-sm font-semibold">
							<PackageCheck
								className="mt-0.5 shrink-0 text-primary"
								size={18}
							/>
							<p>{config.warning}</p>
						</div>

						{/* Campo de motivo - solo para rechazo */}
						{isRejectAction && (
							<div className="space-y-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4">
								<p className="text-sm font-bold">Motivo del rechazo:</p>
								<div className="flex flex-wrap gap-2">
									{rejectionReasons.map((reasonOption) => (
										<button
											key={reasonOption}
											className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
												reason === reasonOption
													? "border-primary bg-primary/10 text-primary"
													: "border-border-light hover:border-primary/50"
											}`}
											onClick={() => handleReasonSelect(reasonOption)}
											type="button"
										>
											{reasonOption}
										</button>
									))}
								</div>
								{showCustomInput && (
									<textarea
										placeholder="Escribe tu motivo..."
										className="w-full rounded-xl border border-border-light p-3 text-sm"
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										rows={2}
									/>
								)}
							</div>
						)}
					</div>

					<footer className="flex shrink-0 flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-4 py-3 sm:flex-row sm:px-6 sm:py-4">
						<button
							className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-50"
							disabled={isSaving}
							onClick={onClose}
							type="button"
						>
							Cancelar
						</button>

						<button
							className={`inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full px-5 text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClassName}`}
							disabled={isSaving}
							onClick={confirmAction}
							type="button"
						>
							{isSaving ? (
								<LoaderCircle className="animate-spin" size={16} />
							) : (
								<Icon size={16} />
							)}
							{config.buttonLabel}
						</button>
					</footer>
				</section>
			</div>

			{/* Modal de error */}
			{errorModal && (
				<div
					className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/65 p-2 backdrop-blur-sm sm:p-4"
					onClick={() => setErrorModal(null)}
					onKeyDown={(event) => {
						if (event.key === "Escape") setErrorModal(null);
					}}
					tabIndex={-1}
					role="dialog"
					aria-modal="true"
				>
					<div className="my-2 w-full max-w-md rounded-[24px] border border-(--theme-error-border) bg-card-bg-light p-4 shadow-2xl sm:my-auto sm:rounded-[28px] sm:p-6">
						<div className="flex items-center gap-4">
							<span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--theme-error-bg) text-(--theme-error)">
								<AlertTriangle size={24} />
							</span>
							<div>
								<h3 className="text-lg font-black">Error</h3>
								<p className="text-sm font-semibold opacity-80">{errorModal}</p>
							</div>
						</div>
						<button
							className="mt-6 w-full rounded-full border border-border-light bg-card-bg-light py-3 text-sm font-black uppercase transition hover:bg-secondary-bg-light"
							onClick={() => setErrorModal(null)}
							type="button"
						>
							Entendido
						</button>
					</div>
				</div>
			)}
		</>
	);
}

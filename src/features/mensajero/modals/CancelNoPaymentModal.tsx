import { DollarSign, LoaderCircle, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { MessengerOrder } from "../types";
import { formatBolivianos } from "../utils/money";

interface CancelNoPaymentModalProps {
	order: MessengerOrder;
	isSaving: boolean;
	onClose: () => void;
	onConfirm: (notes: string) => Promise<void>;
}

export default function CancelNoPaymentModal({
	order,
	isSaving,
	onClose,
	onConfirm,
}: CancelNoPaymentModalProps) {
	const [notes, setNotes] = useState("");

	const currentDate = useMemo(
		() =>
			new Intl.DateTimeFormat("es-BO", {
				dateStyle: "short",
				timeStyle: "short",
			}).format(new Date()),
		[],
	);

	const confirmCancellation = async () => {
		if (isSaving) return;
		await onConfirm(notes.trim());
	};

	return (
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
		>
			<section className="my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-card-bg-light text-text-light shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
				<header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-light px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
					<div className="flex items-center gap-4">
						<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--theme-error-bg) text-(--theme-error) sm:h-12 sm:w-12">
							<DollarSign size={24} />
						</span>

						<div>
							<h2 className="text-lg font-black leading-tight tracking-normal sm:text-lg">
								Cancelar pedido
							</h2>
							<p className="text-sm font-medium opacity-70">
								Registra la cancelación por falta de pago.
							</p>
						</div>
					</div>

					<button
						aria-label="Cerrar"
						className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
						onClick={onClose}
						type="button"
					>
						<X size={16} />
					</button>
				</header>

				<div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
					<div className="grid gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 sm:grid-cols-3">
						<div>
							<p className="text-xs font-bold uppercase opacity-50">Cliente</p>
							<p className="mt-1 text-sm font-bold">{order.customerName}</p>
						</div>

						<div>
							<p className="text-xs font-bold uppercase opacity-50">Monto</p>
							<p className="mt-1 text-sm font-bold">
								{formatBolivianos(order.cashToCollect)}
							</p>
						</div>

						<div>
							<p className="text-xs font-bold uppercase opacity-50">Fecha</p>
							<p className="mt-1 text-sm font-bold">{currentDate}</p>
						</div>
					</div>

					<div className="rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) p-4 text-sm font-semibold text-(--theme-error)">
						El pedido será marcado como CANCELADO porque el cliente no realizó
						el pago contra entrega.
					</div>

					<label className="block text-sm font-bold">
						Observaciones adicionales
						<textarea
							className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-medium outline-none focus:border-(--theme-error-border)"
							onChange={(event) => setNotes(event.target.value)}
							placeholder="Ej: El cliente indicó que no realizará el pago..."
							value={notes}
						/>
					</label>
				</div>

				<footer className="flex shrink-0 flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-4 py-3 sm:flex-row sm:px-6 sm:py-4">
					<button
						className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
						onClick={onClose}
						type="button"
					>
						Volver
					</button>

					<button
						className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-(--theme-error) px-5 text-sm font-black uppercase text-(--theme-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isSaving}
						onClick={confirmCancellation}
						type="button"
					>
						{isSaving ? (
							<LoaderCircle className="animate-spin" size={16} />
						) : (
							<XCircle size={16} />
						)}
						Confirmar cancelación
					</button>
				</footer>
			</section>
		</div>
	);
}

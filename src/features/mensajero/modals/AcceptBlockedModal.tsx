import { AlertTriangle, X } from "lucide-react";
import { ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE } from "../utils/acceptEligibility";

interface AcceptBlockedModalProps {
	onClose: () => void;
}

export default function AcceptBlockedModal({
	onClose,
}: AcceptBlockedModalProps) {
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
			aria-labelledby="accept-blocked-title"
		>
			<section className="my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-card-bg-light text-text-light shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
				<header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-light px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
					<div className="flex min-w-0 items-center gap-3 sm:gap-4">
						<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 sm:h-12 sm:w-12">
							<AlertTriangle size={24} />
						</span>
						<div className="min-w-0">
							<h2
								className="text-lg font-black leading-tight tracking-normal sm:text-lg"
								id="accept-blocked-title"
							>
								No puedes aceptar este pedido
							</h2>
							<p className="text-sm font-medium opacity-70">
								Tienes una entrega activa en curso.
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

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
					<div className="flex gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 text-sm font-semibold">
						<AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
						<p>{ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE}</p>
					</div>
				</div>

				<footer className="shrink-0 border-t border-border-light bg-secondary-bg-light/50 px-4 py-3 sm:px-6 sm:py-4">
					<button
						className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
						onClick={onClose}
						type="button"
					>
						Entendido
					</button>
				</footer>
			</section>
		</div>
	);
}

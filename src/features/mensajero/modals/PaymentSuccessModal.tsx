interface Props {
	onClose: () => void;
}

export default function PaymentSuccessModal({ onClose }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="success-title"
		>
			<button
				type="button"
				aria-label="Cerrar confirmación"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			<div className="relative z-10 my-2 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-5 shadow-2xl sm:my-auto sm:p-6">
				<div className="flex flex-col items-center gap-3 text-center">
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</div>
					<h2 id="success-title" className="text-lg font-bold text-text-light">
						¡Pago registrado!
					</h2>
					<p className="text-sm text-text-light opacity-70">
						El pago ha sido registrado exitosamente.
					</p>
				</div>

				<div className="mt-6">
					<button
						type="button"
						onClick={onClose}
						className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-action transition hover:opacity-90 active:scale-95"
					>
						Aceptar
					</button>
				</div>
			</div>
		</div>
	);
}

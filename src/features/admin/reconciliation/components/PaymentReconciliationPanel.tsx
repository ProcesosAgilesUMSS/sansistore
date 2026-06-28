import { AlertTriangle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseOrderId } from "../../../cart/services/orderService";
import { listenPaymentReconciliation } from "../services/paymentReconciliationService";
import type {
	PaymentReconciliationItem,
	ReconciliationFilter,
	ReconciliationIssueType,
} from "../types";
import { RECONCILIATION_ISSUE_LABELS } from "../types";

const formatCurrency = (amount: number): string =>
	`Bs. ${amount.toLocaleString("es-BO", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

const formatDateTime = (date: Date | null): string => {
	if (!date) return "Sin fecha";

	return date.toLocaleString("es-BO", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const issueStyles: Record<ReconciliationIssueType, string> = {
	"missing-payment":
		"bg-(--theme-danger-bg) text-(--theme-danger) border-(--theme-danger-border)",
	"pending-payment":
		"bg-(--theme-warning-bg) text-(--theme-warning) border-(--theme-warning-border)",
	"amount-mismatch":
		"bg-(--theme-info-bg) text-(--theme-info) border-(--theme-info-border)",
};

const filterOptions: { label: string; value: ReconciliationFilter }[] = [
	{ label: "Todas", value: "all" },
	{ label: "Sin pago", value: "missing-payment" },
	{ label: "No cobrado", value: "pending-payment" },
	{ label: "Monto diferente", value: "amount-mismatch" },
];

function IssueBadge({ issueType }: { issueType: ReconciliationIssueType }) {
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-bold ${issueStyles[issueType]}`}
		>
			{RECONCILIATION_ISSUE_LABELS[issueType]}
		</span>
	);
}

function SummaryCard({
	label,
	value,
	tone,
}: {
	label: string;
	value: number | string;
	tone?: string;
}) {
	return (
		<div className="rounded-xl border border-(--theme-border) bg-(--theme-card-bg) p-4">
			<p className="text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-40">
				{label}
			</p>
			<p
				className={`mt-2 text-2xl font-black ${tone ?? "text-(--theme-text)"}`}
			>
				{value}
			</p>
		</div>
	);
}

function OrderIdSummary({ orderId }: { orderId: string }) {
	const { uuid, friendlyName } = parseOrderId(orderId);

	return (
		<>
			<p
				className="max-w-[180px] truncate font-mono text-xs font-black uppercase text-(--theme-text)"
				title={orderId}
			>
				#{friendlyName}
			</p>
			{uuid !== friendlyName && (
				<p className="mt-1 max-w-[180px] truncate font-mono text-xs text-(--theme-text) opacity-45">
					{uuid}
				</p>
			)}
		</>
	);
}

export default function PaymentReconciliationPanel() {
	const [items, setItems] = useState<PaymentReconciliationItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [issueFilter, setIssueFilter] = useState<ReconciliationFilter>("all");

	useEffect(() => {
		const unsubscribe = listenPaymentReconciliation(
			(nextItems) => {
				setItems(nextItems);
				setLoading(false);
			},
			(err) => {
				console.error("Error al cargar conciliacion de pagos:", err);
				setError(
					"No se pudo cargar la conciliacion de pagos. Verifica la conexion.",
				);
				setLoading(false);
			},
		);

		return unsubscribe;
	}, []);

	const filteredItems = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return items.filter((item) => {
			const matchesIssue =
				issueFilter === "all" || item.issueType === issueFilter;
			const matchesSearch =
				!normalizedSearch ||
				item.orderId.toLowerCase().includes(normalizedSearch) ||
				item.customerName.toLowerCase().includes(normalizedSearch) ||
				item.customerPhone.toLowerCase().includes(normalizedSearch);

			return matchesIssue && matchesSearch;
		});
	}, [items, issueFilter, search]);

	const summary = useMemo(
		() => ({
			total: items.length,
			missingPayment: items.filter(
				(item) => item.issueType === "missing-payment",
			).length,
			pendingPayment: items.filter(
				(item) => item.issueType === "pending-payment",
			).length,
			amountMismatch: items.filter(
				(item) => item.issueType === "amount-mismatch",
			).length,
		}),
		[items],
	);

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-base font-semibold text-(--theme-text)">
					Conciliacion de pagos
				</h2>
				<p className="mt-0.5 text-xs text-(--theme-text) opacity-50">
					Pedidos entregados con diferencias frente a los pagos registrados.
				</p>
			</div>

			<div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					label="Inconsistencias"
					value={summary.total}
					tone="text-primary"
				/>
				<SummaryCard
					label="Sin pago"
					value={summary.missingPayment}
					tone="text-(--theme-danger)"
				/>
				<SummaryCard
					label="No cobrados"
					value={summary.pendingPayment}
					tone="text-(--theme-warning)"
				/>
				<SummaryCard
					label="Monto diferente"
					value={summary.amountMismatch}
					tone="text-(--theme-info)"
				/>
			</div>

			<div className="mb-5 rounded-xl border border-(--theme-border) bg-(--theme-card-bg) p-4">
				<p className="mb-3 border-b border-(--theme-border) pb-2 text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-40">
					Filtros
				</p>

				<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div className="relative w-full lg:max-w-md">
						<label
							htmlFor="payment-reconciliation-search"
							className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-50"
						>
							Buscar pedido o cliente
						</label>
						<Search
							size={15}
							className="pointer-events-none absolute bottom-2.5 left-3 text-(--theme-text) opacity-35"
						/>
						<input
							id="payment-reconciliation-search"
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="ID, cliente o telefono"
							className="h-10 w-full rounded-lg border border-(--theme-border) bg-(--theme-secondary-bg) pl-9 pr-3 text-sm text-(--theme-text) outline-none placeholder:text-(--theme-text)/30 focus:border-primary"
						/>
					</div>

					<div>
						<p className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-50">
							Tipo de diferencia
						</p>
						<div className="flex flex-wrap gap-2">
							{filterOptions.map((option) => {
								const active = issueFilter === option.value;
								return (
									<button
										key={option.value}
										type="button"
										onClick={() => setIssueFilter(option.value)}
										className={`h-10 rounded-full border px-4 text-xs font-bold transition-colors ${
											active
												? "border-primary bg-primary text-white"
												: "border-(--theme-border) text-(--theme-text) opacity-65 hover:border-primary hover:text-primary hover:opacity-100"
										}`}
									>
										{option.label}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{error && (
				<div className="mb-4 flex items-center gap-2 rounded-xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-3 text-xs font-semibold text-(--theme-error)">
					<AlertTriangle size={16} />
					{error}
				</div>
			)}

			{loading && (
				<div className="flex flex-col gap-2">
					{[1, 2, 3, 4].map((item) => (
						<div
							key={item}
							className="h-16 animate-pulse rounded-xl bg-(--theme-secondary-bg)"
						/>
					))}
				</div>
			)}

			{!loading && filteredItems.length === 0 && (
				<div className="rounded-xl border border-dashed border-(--theme-border) bg-(--theme-card-bg) px-6 py-12 text-center">
					<CheckCircle2 className="mx-auto text-primary" size={32} />
					<p className="mt-3 text-sm font-bold text-(--theme-text)">
						No hay diferencias para revisar
					</p>
					<p className="mt-1 text-xs text-(--theme-text) opacity-50">
						Los pedidos entregados coinciden con los pagos registrados segun los
						filtros actuales.
					</p>
				</div>
			)}

			{!loading && filteredItems.length > 0 && (
				<>
					<div className="mb-3 flex items-center justify-between">
						<p className="text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-40">
							Resultados ({filteredItems.length})
						</p>
						<div className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--theme-text) opacity-45">
							<RefreshCw size={12} />
							Actualizacion automatica
						</div>
					</div>

					<div className="overflow-hidden rounded-xl border border-(--theme-border) bg-(--theme-card-bg)">
						<div className="overflow-x-auto">
							<table className="w-full min-w-[900px] border-collapse">
								<thead>
									<tr className="bg-(--theme-secondary-bg)">
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Pedido
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Cliente
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Total
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Pago
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Diferencia
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Estado
										</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-(--theme-text) opacity-45">
											Tipo
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredItems.map((item, index) => (
										<tr
											key={`${item.orderId}-${item.issueType}`}
											className={
												index % 2 === 0
													? "bg-(--theme-card-bg)"
													: "bg-(--theme-secondary-bg)/40"
											}
										>
											<td className="px-4 py-3 align-top">
												<OrderIdSummary orderId={item.orderId} />
												<p className="mt-1 text-xs text-(--theme-text) opacity-45">
													{formatDateTime(item.deliveredAt ?? item.updatedAt)}
												</p>
											</td>
											<td className="px-4 py-3 align-top">
												<p className="text-xs font-bold text-(--theme-text)">
													{item.customerName}
												</p>
												<p className="text-xs text-(--theme-text) opacity-45">
													{item.customerPhone || "Sin telefono"}
												</p>
											</td>
											<td className="px-4 py-3 align-top text-xs font-bold text-(--theme-text)">
												{formatCurrency(item.orderTotal)}
											</td>
											<td className="px-4 py-3 align-top">
												<p className="text-xs font-bold text-(--theme-text)">
													{item.paymentAmount === null
														? "Sin pago"
														: formatCurrency(item.paymentAmount)}
												</p>
												<p className="text-xs text-(--theme-text) opacity-45">
													{item.paymentMethod}
												</p>
											</td>
											<td className="px-4 py-3 align-top text-xs font-black text-(--theme-danger)">
												{formatCurrency(item.difference)}
											</td>
											<td className="px-4 py-3 align-top">
												<p className="text-xs font-bold text-(--theme-text)">
													{item.paymentStatus}
												</p>
												<p className="text-xs text-(--theme-text) opacity-45">
													Entrega: {item.deliveryStatus}
												</p>
											</td>
											<td className="px-4 py-3 align-top">
												<IssueBadge issueType={item.issueType} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

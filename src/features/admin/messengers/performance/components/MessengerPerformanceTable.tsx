import type { MessengerDeliveryPerformance } from "../types";

const formatDateTime = (value: string): string =>
	new Date(value).toLocaleString("es-BO", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

const formatElapsedTime = (minutes: number): string =>
	minutes === 1 ? "1 minuto" : `${minutes} minutos`;

interface Props {
	deliveries: MessengerDeliveryPerformance[];
	showMessenger?: boolean;
}

export default function MessengerPerformanceTable({
	deliveries,
	showMessenger = false,
}: Props) {
	return (
		<div className="border border-(--theme-border) rounded-xl overflow-x-auto">
			<table className="w-full border-collapse min-w-[720px]">
				<thead>
					<tr className="bg-(--theme-secondary-bg)">
						<th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">
							Pedido
						</th>
						{showMessenger && (
							<th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">
								Mensajero
							</th>
						)}
						<th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">
							Fecha/Hora de asignación
						</th>
						<th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">
							Fecha/Hora de entrega
						</th>
						<th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">
							Tiempo transcurrido
						</th>
					</tr>
				</thead>
				<tbody>
					{deliveries.map((delivery, index) => (
						<tr
							key={`${delivery.orderId}-${delivery.assignedAt}`}
							className={
								index % 2 === 0
									? "bg-(--theme-card-bg)"
									: "bg-(--theme-secondary-bg)/50"
							}
						>
							<td className="px-4 py-2.5 font-mono text-xs text-(--theme-text)/50">
								{delivery.orderId}
							</td>
							{showMessenger && (
								<td className="px-4 py-2.5 text-xs font-medium text-(--theme-text)">
									{delivery.messengerName ?? "Mensajero"}
								</td>
							)}
							<td className="px-4 py-2.5 text-xs text-(--theme-text)">
								{formatDateTime(delivery.assignedAt)}
							</td>
							<td className="px-4 py-2.5 text-xs text-(--theme-text)">
								{formatDateTime(delivery.deliveredAt)}
							</td>
							<td className="px-4 py-2.5 text-xs font-medium text-primary">
								{formatElapsedTime(delivery.elapsedTimeMinutes)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

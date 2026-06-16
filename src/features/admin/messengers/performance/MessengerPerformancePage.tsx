import { useEffect, useState } from "react";
import MessengerPerformanceFilters from "./components/MessengerPerformanceFilters";
import MessengerPerformanceKpis from "./components/MessengerPerformanceKpis";
import MessengerPerformanceTable from "./components/MessengerPerformanceTable";
import {
	getMessengerPerformanceByDay,
	getMessengers,
	listenRecentCompletedDeliveries,
} from "./messengerPerformanceService";
import type {
	MessengerDeliveryPerformance,
	MessengerOption,
	MessengerPerformanceReport,
} from "./types";

export default function MessengerPerformancePage() {
	const [messengers, setMessengers] = useState<MessengerOption[]>([]);
	const [recentDeliveries, setRecentDeliveries] = useState<
		MessengerDeliveryPerformance[]
	>([]);
	const [selectedMessengerId, setSelectedMessengerId] = useState("");
	const [selectedDate, setSelectedDate] = useState("");
	const [report, setReport] = useState<MessengerPerformanceReport | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMessengers, setLoadingMessengers] = useState(true);
	const [loadingRecentDeliveries, setLoadingRecentDeliveries] = useState(true);
	const [error, setError] = useState("");
	const [recentDeliveriesError, setRecentDeliveriesError] = useState("");
	const [validationError, setValidationError] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	useEffect(() => {
		let mounted = true;

		const loadMessengers = async () => {
			setLoadingMessengers(true);
			try {
				const data = await getMessengers();
				if (mounted) setMessengers(data);
			} catch {
				if (mounted)
					setError(
						"No se pudo cargar la lista de mensajeros. Verificá que el emulador esté sembrado e intentá nuevamente.",
					);
			} finally {
				if (mounted) setLoadingMessengers(false);
			}
		};

		void loadMessengers();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		const unsubscribe = listenRecentCompletedDeliveries(
			(deliveries) => {
				setRecentDeliveries(deliveries);
				setRecentDeliveriesError("");
				setLoadingRecentDeliveries(false);
			},
			() => {
				setRecentDeliveriesError(
					"Error al obtener el desempeño del mensajero. Intente nuevamente.",
				);
				setLoadingRecentDeliveries(false);
			},
		);

		return () => {
			unsubscribe();
		};
	}, []);

	const handleGenerate = async () => {
		if (!selectedMessengerId || !selectedDate) {
			setValidationError(
				"Seleccioná un mensajero y una fecha para generar el reporte.",
			);
			return;
		}

		setLoading(true);
		setError("");
		setValidationError("");
		setReport(null);
		setHasSearched(true);

		try {
			const data = await getMessengerPerformanceByDay(
				selectedMessengerId,
				selectedDate,
			);
			setReport(data);
		} catch {
			setError(
				"Error al obtener el desempeño del mensajero. Intente nuevamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	const showEmptyData =
		hasSearched &&
		report &&
		!loading &&
		!error &&
		report.deliveries.length === 0;

	return (
		<div className="max-w-5xl">
			<div className="mb-6">
				<h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
					Desempeño de mensajeros
				</h2>
				<p className="text-[11px] text-[var(--theme-text)]/50 mt-0.5">
					Consultá el rendimiento de los mensajeros según sus entregas
					realizadas.
				</p>
			</div>

			<MessengerPerformanceFilters
				messengers={messengers}
				selectedMessengerId={selectedMessengerId}
				selectedDate={selectedDate}
				loading={loading}
				loadingMessengers={loadingMessengers}
				onMessengerChange={(messengerId) => {
					setSelectedMessengerId(messengerId);
					setValidationError("");
					setError("");
					setReport(null);
					setHasSearched(false);
				}}
				onDateChange={(date) => {
					setSelectedDate(date);
					setValidationError("");
					setError("");
					setReport(null);
					setHasSearched(false);
				}}
				onGenerate={handleGenerate}
			/>

			{!loadingMessengers && messengers.length === 0 && !error && (
				<p className="text-[11px] text-[var(--theme-text)]/40 mt-3">
					No hay mensajeros activos registrados.
				</p>
			)}

			{validationError && (
				<p className="text-[11px] text-red-500 mt-3">{validationError}</p>
			)}

			<div className="mt-6">
				{loading && (
					<div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
						<p className="text-[13px] text-[var(--theme-text)]/40">
							Cargando desempeño del mensajero...
						</p>
					</div>
				)}

				{error && !loading && (
					<div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium bg-red-500/10 border border-red-500/20 text-red-500">
						<span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
							!
						</span>
						{error}
					</div>
				)}

				{!hasSearched && !loading && !error && (
					<>
						<p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
							Últimos pedidos completados
						</p>

						{loadingRecentDeliveries && (
							<div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
								<p className="text-[13px] text-[var(--theme-text)]/40">
									Cargando desempeño del mensajero...
								</p>
							</div>
						)}

						{recentDeliveriesError && !loadingRecentDeliveries && (
							<div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium bg-red-500/10 border border-red-500/20 text-red-500">
								<span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
									!
								</span>
								{recentDeliveriesError}
							</div>
						)}

						{!loadingRecentDeliveries &&
							!recentDeliveriesError &&
							recentDeliveries.length === 0 && (
								<div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
									<p className="text-[13px] text-[var(--theme-text)]/40">
										No hay pedidos completados recientes.
									</p>
								</div>
							)}

						{!loadingRecentDeliveries &&
							!recentDeliveriesError &&
							recentDeliveries.length > 0 && (
								<MessengerPerformanceTable
									deliveries={recentDeliveries}
									showMessenger
								/>
							)}
					</>
				)}

				{showEmptyData && (
					<div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
						<p className="text-[13px] text-[var(--theme-text)]/40">
							No hay entregas registradas para este mensajero en la fecha
							seleccionada.
						</p>
					</div>
				)}

				{report && report.deliveries.length > 0 && !loading && !error && (
					<>
						<p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
							Resumen del día
						</p>
						<MessengerPerformanceKpis report={report} />

						<p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
							Historial de entregas
						</p>
						<MessengerPerformanceTable deliveries={report.deliveries} />
					</>
				)}
			</div>
		</div>
	);
}

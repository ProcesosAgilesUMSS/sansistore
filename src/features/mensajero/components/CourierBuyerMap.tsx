import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import L from "leaflet";
import {
	ArrowLeft,
	Banknote,
	Info,
	MapPin,
	Moon,
	Package,
	Phone,
	Sun,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	MapContainer,
	Marker,
	Polygon,
	TileLayer,
	ZoomControl,
} from "react-leaflet";
import { db } from "../../../lib/firebase";
import { ALLOWED_ZONES } from "../../location/utils/zoneLimits";
import { formatBolivianos } from "../utils/money";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
	iconUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
	shadowUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

type BuyerMapItem = {
	name: string;
	quantity: number;
};

type BuyerMapOrder = {
	customerName: string;
	phone: string;
	address: string;
	reference?: string;
	items: BuyerMapItem[];
	cashToCollect: number;
};

const FALLBACK_POSITION: [number, number] = [-17.394, -66.1473];
const THEME_STORAGE_KEY = "sansistore-theme";

type ThemeMode = "light" | "dark";

const applyTheme = (theme: ThemeMode) => {
	document.documentElement.dataset.theme = theme;
	document.documentElement.style.colorScheme = theme;

	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Keep visual theme even if local storage is unavailable.
	}
};

function readOrderFromStorage(): BuyerMapOrder | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem("courier_panel_order");
		return raw ? (JSON.parse(raw) as BuyerMapOrder) : null;
	} catch {
		return null;
	}
}

function readInitialOrder(): BuyerMapOrder | null {
	if (typeof window === "undefined") return null;

	const params = new URLSearchParams(window.location.search);
	const mode = params.get("mode");

	if (mode === "seller") {
		try {
			const raw = window.localStorage.getItem("courier_panel_seller");
			return raw ? (JSON.parse(raw) as BuyerMapOrder) : null;
		} catch {
			return null;
		}
	}

	if (params.get("order")) return null;

	return readOrderFromStorage();
}

const asString = (value: unknown): string | null =>
	typeof value === "string" && value.trim() ? value.trim() : null;

async function readOrderFromFirestore(
	orderId: string,
): Promise<BuyerMapOrder | null> {
	const orderSnap = await getDoc(doc(db, "orders", orderId));
	if (!orderSnap.exists()) return null;

	const order = orderSnap.data();
	const itemsSnapshot = await getDocs(
		collection(db, "orders", orderId, "orderItems"),
	);
	const locationId = asString(order.locationId);
	const locationSnap = locationId
		? await getDoc(doc(db, "locations", locationId))
		: null;
	const location = locationSnap?.exists() ? locationSnap.data() : {};

	const items = itemsSnapshot.docs.map((itemDoc) => {
		const item = itemDoc.data();
		return {
			name: String(item.productName || "Producto sin nombre"),
			quantity: Number(item.quantity || 0),
		};
	});

	return {
		customerName: String(order.customerName || "Cliente no registrado"),
		phone: String(order.customerPhone || "Sin telefono"),
		address: String(
			order.address || asString(location.label) || "Direccion no registrada",
		),
		reference:
			asString(order.reference) ||
			asString(order.locationLabel) ||
			asString(location.label) ||
			undefined,
		items,
		cashToCollect: Number(order.total || 0),
	};
}

export default function CourierBuyerMap() {
	const [order, setOrder] = useState<BuyerMapOrder | null>(() =>
		readInitialOrder(),
	);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [theme, setTheme] = useState<ThemeMode>("light");

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const orderId = params.get("order");
		const mode = params.get("mode");

		if (!orderId || mode === "seller") return;

		let isMounted = true;

		readOrderFromFirestore(orderId)
			.then((freshOrder) => {
				if (!isMounted || !freshOrder) return;
				setOrder(freshOrder);
				localStorage.setItem("courier_panel_order", JSON.stringify(freshOrder));
			})
			.catch(() => {});

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		const savedTheme = window.localStorage.getItem(
			THEME_STORAGE_KEY,
		) as ThemeMode | null;
		const currentTheme =
			savedTheme ||
			(document.documentElement.dataset.theme === "dark" ? "dark" : "light");

		applyTheme(currentTheme);
		setTheme(currentTheme);
	}, []);

	const position = useMemo<[number, number]>(() => {
		const params = new URLSearchParams(window.location.search);
		const lat = Number(params.get("lat"));
		const lng = Number(params.get("lng"));
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			return [lat, lng];
		}
		return FALLBACK_POSITION;
	}, []);

	const isSeller = useMemo(() => {
		return new URLSearchParams(window.location.search).get("mode") === "seller";
	}, []);

	const toggleTheme = () => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		applyTheme(nextTheme);
		setTheme(nextTheme);
	};

	const detailsContent = (
		<>
			<p className="mb-1 text-xs font-bold uppercase text-primary">
				{isSeller ? "Ubicacion del vendedor" : "Pedido del comprador"}
			</p>
			<h1 className="text-xl font-black leading-tight tracking-normal sm:text-2xl">
				{order?.customerName ?? "Cliente no registrado"}
			</h1>

			<div className="mt-4 space-y-3 text-sm sm:mt-5 sm:space-y-4">
				<p className="flex items-start gap-3">
					<MapPin className="mt-0.5 shrink-0 text-primary" size={18} />
					<span>
						<span className="block font-bold">
							{order?.address ?? "Direccion no registrada"}
						</span>
						{order?.reference && (
							<span className="mt-1 block text-xs opacity-70">
								{order.reference}
							</span>
						)}
					</span>
				</p>

				<p className="flex items-center gap-3">
					<Phone className="shrink-0 text-primary" size={18} />
					<span className="font-bold">{order?.phone ?? "Sin telefono"}</span>
				</p>

				{!isSeller && (
					<>
						<div className="flex items-start gap-3">
							<Package className="mt-0.5 shrink-0 text-primary" size={18} />
							<div className="min-w-0 space-y-2">
								{(order?.items?.length ?? 0) > 0 ? (
									order?.items.map((item) => (
										<p key={`${item.name}-${item.quantity}`}>
											{item.quantity}x {item.name}
										</p>
									))
								) : (
									<p>Productos no registrados</p>
								)}
							</div>
						</div>

						<div className="rounded-2xl border border-primary/50 bg-primary/10 p-4">
							<p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
								<Banknote size={16} />
								Cobro
							</p>
							<p className="mt-2 text-3xl font-black">
								{formatBolivianos(order?.cashToCollect ?? 0)}
							</p>
						</div>
					</>
				)}
			</div>
		</>
	);

	return (
		<main className="relative h-dvh overflow-hidden bg-bg-light text-text-light">
			<MapContainer
				center={position}
				zoom={17}
				className="h-full w-full"
				zoomControl={false}
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<ZoomControl position="bottomleft" />

				{ALLOWED_ZONES.map((zone, index) => (
					<Polygon
						key={zone.name}
						positions={zone.points}
						pathOptions={{
							color: index === 0 ? "#88b04b" : "#3b82f6",
							fillColor: index === 0 ? "#88b04b" : "#3b82f6",
							fillOpacity: 0.16,
							weight: 2,
						}}
					/>
				))}

				<Marker position={position} />
			</MapContainer>

			<a
				href="/courier"
				className="absolute left-4 top-4 z-[500] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-text-light shadow-lg transition hover:border-primary hover:text-primary"
				aria-label="Volver a entregas"
			>
				<ArrowLeft size={20} />
			</a>

			<button
				aria-label="Cambiar tema"
				className="absolute right-4 top-16 z-[500] inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-card-bg-light text-primary shadow-lg transition hover:border-primary md:top-4"
				onClick={toggleTheme}
				type="button"
			>
				{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
			</button>

			<button
				className="absolute right-4 top-4 z-[500] inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 text-sm font-bold text-text-light shadow-lg transition hover:border-primary hover:text-primary md:hidden"
				onClick={() => setIsDetailsOpen(true)}
				type="button"
			>
				<Info size={18} />
				Detalles
			</button>

			{isDetailsOpen && (
				<>
					<button
						type="button"
						aria-label="Cerrar detalles"
						className="absolute inset-0 z-[650] bg-black/20 backdrop-blur-[1px] md:hidden"
						onClick={() => setIsDetailsOpen(false)}
					/>
					<aside className="absolute inset-x-3 top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-[24px] border border-border-light bg-card-bg-light/95 p-4 text-text-light shadow-2xl backdrop-blur">
						<button
							aria-label="Cerrar detalles"
							className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
							onClick={() => setIsDetailsOpen(false)}
							type="button"
						>
							<X size={16} />
						</button>

						<div className="pr-8">{detailsContent}</div>
					</aside>
				</>
			)}

			<aside className="absolute bottom-auto left-auto right-6 top-1/2 z-[500] hidden max-h-[calc(100dvh-2rem)] w-[360px] max-w-[calc(100vw-3rem)] -translate-y-1/2 overflow-y-auto rounded-[24px] border border-border-light bg-card-bg-light/95 p-5 text-text-light shadow-2xl backdrop-blur md:block">
				<p className="mb-1 text-xs font-bold uppercase text-primary">
					{isSeller ? "Ubicación del vendedor" : "Pedido del comprador"}
				</p>
				<h1 className="text-xl font-black leading-tight tracking-normal sm:text-2xl">
					{order?.customerName ?? "Cliente no registrado"}
				</h1>

				<div className="mt-4 space-y-3 text-sm sm:mt-5 sm:space-y-4">
					<p className="flex items-start gap-3">
						<MapPin className="mt-0.5 shrink-0 text-primary" size={18} />
						<span>
							<span className="block font-bold">
								{order?.address ?? "Direccion no registrada"}
							</span>
							{order?.reference && (
								<span className="mt-1 block text-xs opacity-70">
									{order.reference}
								</span>
							)}
						</span>
					</p>

					<p className="flex items-center gap-3">
						<Phone className="shrink-0 text-primary" size={18} />
						<span className="font-bold">{order?.phone ?? "Sin telefono"}</span>
					</p>

					{!isSeller && (
						<>
							<div className="flex items-start gap-3">
								<Package className="mt-0.5 shrink-0 text-primary" size={18} />
								<div className="min-w-0 space-y-2">
									{(order?.items?.length ?? 0) > 0 ? (
										order?.items.map((item) => (
											<p key={`${item.name}-${item.quantity}`}>
												{item.quantity}x {item.name}
											</p>
										))
									) : (
										<p>Productos no registrados</p>
									)}
								</div>
							</div>

							<div className="rounded-2xl border border-primary/50 bg-primary/10 p-4">
								<p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
									<Banknote size={16} />
									Cobro
								</p>
								<p className="mt-2 text-3xl font-black">
									{formatBolivianos(order?.cashToCollect ?? 0)}
								</p>
							</div>
						</>
					)}
				</div>
			</aside>
		</main>
	);
}

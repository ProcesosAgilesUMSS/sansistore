import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
	| "CREADO"
	| "ASIGNADO"
	| "EN CAMINO"
	| "ENTREGADO"
	| "PAGADO"
	| "CANCELADO"
	| "NO ENTREGADO"
	| "RESERVADO"
	| "PENDIENTE"
	| "EMPAQUETADO"
	| "LISTO"
	| "DEVUELTO"
	| "CERRADO"
	| "RECHAZADO"
	| "PENDIENTE-ASIGNACION"
	| "ACEPTADO";

export const STATUS_LABELS: Record<OrderStatus, string> = {
	CREADO: "CREADO",
	RESERVADO: "RESERVADO",
	PENDIENTE: "PENDIENTE",
	EMPAQUETADO: "EMPAQUETADO",
	LISTO: "LISTO",
	ASIGNADO: "ASIGNADO",
	ACEPTADO: "ACEPTADO",
	RECHAZADO: "RECHAZADO",
	"PENDIENTE-ASIGNACION": "PENDIENTE-ASIGNACION",
	DEVUELTO: "DEVUELTO",
	"EN CAMINO": "EN CAMINO",
	ENTREGADO: "ENTREGADO",
	PAGADO: "PAGADO",
	CANCELADO: "CANCELADO",
	"NO ENTREGADO": "NO ENTREGADO",
	CERRADO: "CERRADO",
};

export interface OrderItem {
	itemId: string;
	productId: string;
	productName: string;
	unitPrice: number;
	quantity: number;
	subtotal: number;
	description?: string;
	stockAvailable?: number;
	imageUrl?: string;
}

export interface Delivery {
	id: string;
	orderId: string;
	courierId?: string;
	courierName?: string;
	status: string;
	deliveryCode?: string;
	attemptNumber?: number;
	incidentReason?: string | null;
	incidentNotes?: string | null;
	evidenceUrl?: string;
	failureReason?: string;
	amountCollected?: number;
	customerConfirmed?: boolean;
	customerConfirmedAt?: Timestamp | null;
	assignedAt?: Timestamp | null;
	pickedUpAt?: Timestamp | null;
	deliveredAt?: Timestamp | null;
	inTransitAt?: Timestamp | null;
	failedAt?: Timestamp | null;
	reprogrammedAt?: Timestamp | null;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

export interface Order {
	id: string;
	secret?: string;
	buyerId: string;
	buyerName?: string;
	sellerId?: string;
	status: OrderStatus;
	buyerReceptionConfirmed?: boolean;
	buyerReceptionConfirmedAt: Timestamp | null;
	address: string;
	deliveryStatus?: string | null;
	delivery?: Delivery | null;
	paymentId?: string | null;
	paymentStatus?: string | null;
	total?: number;
	items: OrderItem[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
	incidentReason?: string;
	incidentNotes?: string;
}

export type ReturnStatus = "pending_review" | "approved" | "rejected";

export type ReturnReason = "damaged" | "wrong_product" | "unwanted" | "other";

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
	damaged: "Producto dañado",
	wrong_product: "Producto incorrecto",
	unwanted: "No deseado",
	other: "Otro",
};

export interface ReturnItem {
	productId: string;
	productName: string;
	quantity: number;
}

export interface ReturnRequest {
	id?: string;
	orderId: string;
	buyerId: string;
	productId?: string;
	productName?: string;
	items?: ReturnItem[];
	reason: string;
	description?: string;
	status: ReturnStatus;
	createdAt: Timestamp;
}

export interface UserData {
	displayName?: string;
	email?: string;
	institutionalId?: string;
}

export interface LocationData {
	label: string;
}

export interface DeliveryData {
	courierId?: string;
	courierName?: string;
}

export interface OrderData {
	locationId?: string;
	buyerId: string;
	deliveryId?: string;
	total?: number;
	paymentMethod?: string;
	status: string;
	deliveryStatus?: string;
	paymentStatus?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	incidentReason?: string;
	incidentNotes?: string;
}

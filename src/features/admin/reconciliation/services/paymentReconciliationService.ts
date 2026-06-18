import {
	collection,
	type DocumentData,
	onSnapshot,
	type QueryDocumentSnapshot,
	query,
	type Unsubscribe,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import type {
	PaymentReconciliationItem,
	ReconciliationIssueType,
} from "../types";

interface OrderRecord {
	id: string;
	orderId: string;
	customerName: string;
	customerPhone: string;
	total: number;
	status: string;
	deliveryStatus: string;
	deliveredAt: Date | null;
	updatedAt: Date | null;
}

interface PaymentRecord {
	id: string;
	orderId: string;
	amount: number;
	status: string;
	method: string;
}

const COLLECTED_PAYMENT_STATUSES = new Set([
	"cobrado",
	"cobrado",
	"pagado",
	"paid",
	"verified",
	"verificado",
	"validado",
]);

function normalizeStatus(value: unknown): string {
	return String(value ?? "")
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\s_-]+/g, "");
}

function toDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof (value as { toDate?: unknown }).toDate === "function") {
		return (value as { toDate: () => Date }).toDate();
	}
	return null;
}

function getNumber(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapOrder(snapshot: QueryDocumentSnapshot<DocumentData>): OrderRecord {
	const data = snapshot.data();

	return {
		id: snapshot.id,
		orderId: String(data.orderId ?? snapshot.id),
		customerName: String(data.customerName ?? "Cliente sin nombre"),
		customerPhone: String(data.customerPhone ?? ""),
		total: getNumber(data.total),
		status: String(data.status ?? "Sin estado"),
		deliveryStatus: String(data.deliveryStatus ?? "Sin entrega"),
		deliveredAt: toDate(data.deliveredAt),
		updatedAt: toDate(data.updatedAt),
	};
}

function mapPayment(
	snapshot: QueryDocumentSnapshot<DocumentData>,
): PaymentRecord {
	const data = snapshot.data();

	return {
		id: snapshot.id,
		orderId: String(data.orderId ?? snapshot.id),
		amount: getNumber(data.amount),
		status: String(data.status ?? "PENDIENTE"),
		method: String(data.method ?? "Sin metodo"),
	};
}

function isDeliveredOrder(order: OrderRecord): boolean {
	const deliveryStatus = normalizeStatus(order.deliveryStatus);
	const orderStatus = normalizeStatus(order.status);

	return deliveryStatus === "delivered" || orderStatus === "entregado";
}

function isCollectedPayment(payment: PaymentRecord): boolean {
	return COLLECTED_PAYMENT_STATUSES.has(normalizeStatus(payment.status));
}

function getIssueType(
	order: OrderRecord,
	payment: PaymentRecord | undefined,
): ReconciliationIssueType | null {
	if (!payment) return "missing-payment";
	if (!isCollectedPayment(payment)) return "pending-payment";

	const difference = Number((order.total - payment.amount).toFixed(2));
	if (Math.abs(difference) > 0.01) return "amount-mismatch";

	return null;
}

function buildReconciliationItems(
	orders: OrderRecord[],
	payments: PaymentRecord[],
): PaymentReconciliationItem[] {
	const paymentByOrderId = new Map<string, PaymentRecord>();

	payments.forEach((payment) => {
		paymentByOrderId.set(payment.orderId, payment);
		paymentByOrderId.set(payment.id, payment);
	});

	return orders
		.filter(isDeliveredOrder)
		.map((order) => {
			const payment =
				paymentByOrderId.get(order.orderId) ?? paymentByOrderId.get(order.id);
			const issueType = getIssueType(order, payment);
			if (!issueType) return null;

			const paymentAmount = payment?.amount ?? null;
			const difference = Number(
				(order.total - (paymentAmount ?? 0)).toFixed(2),
			);

			return {
				orderId: order.orderId,
				customerName: order.customerName,
				customerPhone: order.customerPhone,
				orderTotal: order.total,
				paymentAmount,
				difference,
				orderStatus: order.status,
				deliveryStatus: order.deliveryStatus,
				paymentStatus: payment?.status ?? "Sin pago",
				paymentMethod: payment?.method ?? "Sin pago",
				deliveredAt: order.deliveredAt,
				updatedAt: order.updatedAt,
				issueType,
			};
		})
		.filter((item): item is PaymentReconciliationItem => Boolean(item))
		.sort((a, b) => {
			const aTime = a.deliveredAt?.getTime() ?? a.updatedAt?.getTime() ?? 0;
			const bTime = b.deliveredAt?.getTime() ?? b.updatedAt?.getTime() ?? 0;
			return bTime - aTime;
		});
}

export function listenPaymentReconciliation(
	callback: (items: PaymentReconciliationItem[]) => void,
	callbackError?: (error: Error) => void,
): Unsubscribe {
	let orders: OrderRecord[] = [];
	let payments: PaymentRecord[] = [];
	let ordersReady = false;
	let paymentsReady = false;

	const publish = () => {
		if (ordersReady && paymentsReady) {
			callback(buildReconciliationItems(orders, payments));
		}
	};

	const unsubscribeOrders = onSnapshot(
		query(collection(db, "orders")),
		(snapshot) => {
			orders = snapshot.docs.map(mapOrder);
			ordersReady = true;
			publish();
		},
		(error) => callbackError?.(error),
	);

	const unsubscribePayments = onSnapshot(
		query(collection(db, "payments")),
		(snapshot) => {
			payments = snapshot.docs.map(mapPayment);
			paymentsReady = true;
			publish();
		},
		(error) => callbackError?.(error),
	);

	return () => {
		unsubscribeOrders();
		unsubscribePayments();
	};
}

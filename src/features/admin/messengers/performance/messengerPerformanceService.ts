import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	onSnapshot,
	orderBy,
	query,
	type Unsubscribe,
	where,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import type {
	MessengerDeliveryPerformance,
	MessengerOption,
	MessengerPerformanceReport,
} from "./types";

const DELIVERIES_COLLECTION = "deliveries";
const USERS_COLLECTION = "users";
const COMPLETED_DELIVERY_STATUSES = ["delivered", "DELIVERED"];
const RECENT_COMPLETED_DELIVERIES_LIMIT = 10;
const RECENT_COMPLETED_DELIVERIES_QUERY_LIMIT = 30;
const userDisplayNameCache = new Map<string, string>();

const toDate = (value: unknown): Date | null => {
	if (!value) return null;
	if (typeof (value as { toDate?: unknown }).toDate === "function") {
		return (value as { toDate: () => Date }).toDate();
	}

	const parsed = new Date(value as string);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const REPORT_TIME_ZONE = "America/La_Paz";

const toDateInputValue = (date: Date): string => {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: REPORT_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const values = Object.fromEntries(
		parts.map((part) => [part.type, part.value]),
	);
	return `${values.year}-${values.month}-${values.day}`;
};

const isSameInputDay = (date: Date, inputDate: string): boolean =>
	toDateInputValue(date) === inputDate;

const getElapsedMinutes = (assignedAt: Date, deliveredAt: Date): number =>
	Math.max(
		0,
		Math.round((deliveredAt.getTime() - assignedAt.getTime()) / 60000),
	);

const getUserDisplayName = async (messengerId: string): Promise<string> => {
	const cachedDisplayName = userDisplayNameCache.get(messengerId);
	if (cachedDisplayName) {
		return cachedDisplayName;
	}

	const userSnap = await getDoc(doc(db, USERS_COLLECTION, messengerId));
	if (!userSnap.exists()) return "Mensajero";

	const user = userSnap.data();
	const displayName =
		user.displayName ?? user.name ?? user.email ?? "Mensajero";
	userDisplayNameCache.set(messengerId, displayName);
	return displayName;
};

const mapDeliveryPerformance = async (
	deliveryId: string,
	delivery: Record<string, unknown>,
	includeMessenger = false,
): Promise<MessengerDeliveryPerformance | null> => {
	const assignedAt = toDate(delivery.assignedAt) ?? toDate(delivery.createdAt);
	const deliveredAt = toDate(delivery.deliveredAt);
	const courierId =
		typeof delivery.courierId === "string" ? delivery.courierId : "";

	if (
		!assignedAt ||
		!deliveredAt ||
		!COMPLETED_DELIVERY_STATUSES.includes(String(delivery.status))
	) {
		return null;
	}

	return {
		orderId: String(delivery.orderId || delivery.orderCode || deliveryId),
		messengerId: courierId || undefined,
		messengerName:
			includeMessenger && courierId
				? await getUserDisplayName(courierId)
				: undefined,
		assignedAt: assignedAt.toISOString(),
		deliveredAt: deliveredAt.toISOString(),
		elapsedTimeMinutes: getElapsedMinutes(assignedAt, deliveredAt),
		status: String(delivery.status),
	};
};

export const getMessengers = async (): Promise<MessengerOption[]> => {
	const messengersQuery = query(
		collection(db, USERS_COLLECTION),
		where("roles", "array-contains", "mensajero"),
		where("isActive", "==", true),
	);

	const snapshot = await getDocs(messengersQuery);

	return snapshot.docs
		.map((messengerDoc) => {
			const data = messengerDoc.data();
			return {
				id: messengerDoc.id,
				name: data.displayName ?? data.name ?? data.email ?? "Mensajero",
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
};

export const listenRecentCompletedDeliveries = (
	callback: (deliveries: MessengerDeliveryPerformance[]) => void,
	onError?: (error: Error) => void,
): Unsubscribe => {
	const recentDeliveriesQuery = query(
		collection(db, DELIVERIES_COLLECTION),
		orderBy("deliveredAt", "desc"),
		limit(RECENT_COMPLETED_DELIVERIES_QUERY_LIMIT),
	);

	return onSnapshot(
		recentDeliveriesQuery,
		(snapshot) => {
			void Promise.all(
				snapshot.docs.map((deliveryDoc) =>
					mapDeliveryPerformance(deliveryDoc.id, deliveryDoc.data(), true),
				),
			)
				.then((deliveries) => {
					callback(
						deliveries
							.filter((delivery): delivery is MessengerDeliveryPerformance =>
								Boolean(delivery),
							)
							.sort(
								(a, b) =>
									new Date(b.deliveredAt).getTime() -
									new Date(a.deliveredAt).getTime(),
							)
							.slice(0, RECENT_COMPLETED_DELIVERIES_LIMIT),
					);
				})
				.catch((error) => {
					onError?.(
						error instanceof Error
							? error
							: new Error("Recent deliveries query failed"),
					);
				});
		},
		(error) => {
			onError?.(error);
		},
	);
};

export const getMessengerPerformanceByDay = async (
	messengerId: string,
	date: string,
): Promise<MessengerPerformanceReport> => {
	try {
		const [messengerName, deliveriesSnapshot] = await Promise.all([
			getUserDisplayName(messengerId),
			getDocs(
				query(
					collection(db, DELIVERIES_COLLECTION),
					where("courierId", "==", messengerId),
				),
			),
		]);

		const deliveries: MessengerDeliveryPerformance[] = deliveriesSnapshot.docs
			.map((deliveryDoc) => {
				const delivery = deliveryDoc.data();
				const assignedAt =
					toDate(delivery.assignedAt) ?? toDate(delivery.createdAt);
				const deliveredAt = toDate(delivery.deliveredAt);

				if (
					!assignedAt ||
					!deliveredAt ||
					!COMPLETED_DELIVERY_STATUSES.includes(String(delivery.status)) ||
					!isSameInputDay(deliveredAt, date)
				) {
					return null;
				}

				return {
					orderId: String(
						delivery.orderId || delivery.orderCode || deliveryDoc.id,
					),
					assignedAt: assignedAt.toISOString(),
					deliveredAt: deliveredAt.toISOString(),
					elapsedTimeMinutes: getElapsedMinutes(assignedAt, deliveredAt),
				};
			})
			.filter((delivery): delivery is MessengerDeliveryPerformance =>
				Boolean(delivery),
			)
			.sort(
				(a, b) =>
					new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
			);

		const totalElapsedTime = deliveries.reduce(
			(total, delivery) => total + delivery.elapsedTimeMinutes,
			0,
		);

		return {
			messengerId,
			messengerName,
			date,
			totalDeliveries: deliveries.length,
			averageDeliveryTimeMinutes:
				deliveries.length > 0
					? Math.round(totalElapsedTime / deliveries.length)
					: 0,
			deliveries,
		};
	} catch (error) {
		console.error("Messenger performance query failed", error);
		throw error;
	}
};

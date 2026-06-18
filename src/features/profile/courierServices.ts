import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// ============================================
// INTERFACES
// ============================================

export interface DeliveryDoc {
	deliveryId: string;
	deliveryCode: string;
	orderCode: string;
	orderId: string;
	status: string;
	courierId: string;
	amountCollected: number;
	createdAt: Timestamp | null;
	assignedAt: Timestamp | null;
	pickedUpAt: Timestamp | null;
	deliveredAt: Timestamp | null;
	cancelledAt: Timestamp | null;
	failedAt: Timestamp | null;
	inTransitAt: Timestamp | null;
	reprogrammedAt: Timestamp | null;
	newDeliveryAt: Timestamp | null;
	customerConfirmedAt: Timestamp | null;
	updatedAt: Timestamp | null;
	attemptNumber: number;
	customerConfirmed: boolean;
	cancellationReason: string | null;
	cancellationNotes: string | null;
	failureReason: string | null;
	incidentReason: string | null;
	incidentNotes: string | null;
	reprogramReason: string | null;
	evidenceUrl: string | null;
}

export interface UserDoc {
	uid: string;
	ci: string;
	displayName: string;
	email: string;
	phoneNumber: string;
	roles: string[];
	isActive: boolean;
	institutionalId?: string;
	internalPhone?: string;
	photoURL?: string;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
	createdBy?: string;
}

export interface DeliveryStats {
    delivered: DeliveryDoc[];
    notDelivered: DeliveryDoc[];
    totalDelivered: number;
    totalNotDelivered: number;
    total: number;
    deliveryRate: number;
}

export interface DeliveryStatsWithUser extends DeliveryStats {
    userRoles: string[];
    userRole: string | null;
    isCourier: boolean;
    userData: UserDoc | null;
}

// ============================================
// FUNCIONES DE MAPEO
// ============================================

function mapDocToDelivery(
    docData: Record<string, unknown>,
    id: string
): DeliveryDoc {
    return {
        deliveryId: (docData.deliveryId as string) ?? id,
        deliveryCode: (docData.deliveryCode as string) ?? "",
        orderCode: (docData.orderCode as string) ?? "",
        orderId: (docData.orderId as string) ?? "",
        status: (docData.status as string) ?? "",
        courierId: (docData.courierId as string) ?? "",
        amountCollected: (docData.amountCollected as number) ?? 0,
        createdAt: (docData.createdAt as Timestamp) ?? null,
        assignedAt: (docData.assignedAt as Timestamp) ?? null,
        pickedUpAt: (docData.pickedUpAt as Timestamp) ?? null,
        deliveredAt: (docData.deliveredAt as Timestamp) ?? null,
        cancelledAt: (docData.cancelledAt as Timestamp) ?? null,
        failedAt: (docData.failedAt as Timestamp) ?? null,
        inTransitAt: (docData.inTransitAt as Timestamp) ?? null,
        reprogrammedAt: (docData.reprogrammedAt as Timestamp) ?? null,
        newDeliveryAt: (docData.newDeliveryAt as Timestamp) ?? null,
        customerConfirmedAt: (docData.customerConfirmedAt as Timestamp) ?? null,
        updatedAt: (docData.updatedAt as Timestamp) ?? null,
        attemptNumber: (docData.attemptNumber as number) ?? 1,
        customerConfirmed: (docData.customerConfirmed as boolean) ?? false,
        cancellationReason: (docData.cancellationReason as string) ?? null,
        cancellationNotes: (docData.cancellationNotes as string) ?? null,
        failureReason: (docData.failureReason as string) ?? null,
        incidentReason: (docData.incidentReason as string) ?? null,
        incidentNotes: (docData.incidentNotes as string) ?? null,
        reprogramReason: (docData.reprogramReason as string) ?? null,
        evidenceUrl: (docData.evidenceUrl as string) ?? null,
    };
}

function mapDocToUser(
    docData: Record<string, unknown>,
    id: string
): UserDoc {
    return {
        uid: (docData.uid as string) ?? id,
        ci: (docData.ci as string) ?? "",
        displayName: (docData.displayName as string) ?? "",
        email: (docData.email as string) ?? "",
        phoneNumber: (docData.phoneNumber as string) ?? "",
        roles: Array.isArray(docData.roles) ? (docData.roles as string[]) : [],
        isActive: (docData.isActive as boolean) ?? true,
        institutionalId: (docData.institutionalId as string) ?? undefined,
        internalPhone: (docData.internalPhone as string) ?? undefined,
        photoURL: (docData.photoURL as string) ?? undefined,
        createdAt: (docData.createdAt as Timestamp) ?? undefined,
        updatedAt: (docData.updatedAt as Timestamp) ?? undefined,
        createdBy: (docData.createdBy as string) ?? undefined,
    };
}

// ============================================
// SERVICIO DE DELIVERY STATS
// ============================================

export async function getDeliveryStatsByCourier(
    courierId: string
): Promise<DeliveryStats> {
    const deliveriesRef = collection(db, "deliveries");

    const snapshot = await getDocs(
        query(deliveriesRef, where("courierId", "==", courierId))
    );

    const delivered: DeliveryDoc[] = [];
    const notDelivered: DeliveryDoc[] = [];

    snapshot.forEach((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const delivery = mapDocToDelivery(data, doc.id);

        if (delivery.status === "entregado") {
            delivered.push(delivery);
        } else {
            notDelivered.push(delivery);
        }
    });

    const total = snapshot.size;
    const deliveryRate = total > 0
        ? Math.round((delivered.length / total) * 100)
        : 0;

    return {
        delivered,
        notDelivered,
        totalDelivered: delivered.length,
        totalNotDelivered: notDelivered.length,
        total,
        deliveryRate,
    };
}

// ============================================
// SERVICIO DE USUARIO
// ============================================

export async function getUserData(userId: string): Promise<UserDoc | null> {
    if (!userId) {
        throw new Error("User ID is required");
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        const userData = userSnap.data() as Record<string, unknown>;
        return mapDocToUser(userData, userId);
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

export async function getUserRoles(userId: string): Promise<string[]> {
    const userData = await getUserData(userId);

    if (!userData) {
        throw new Error(`User with ID ${userId} not found`);
    }

    return userData.roles || [];
}

export async function userHasRole(userId: string, role: string): Promise<boolean> {
    const roles = await getUserRoles(userId);
    return roles.includes(role);
}

export async function getPrimaryUserRole(
	userId: string,
): Promise<string | null> {
	const roles = await getUserRoles(userId);
	return roles.length > 0 ? roles[0] : null;
}

// ============================================
// SERVICIO COMBINADO
// ============================================

export async function getDeliveryStatsWithUserInfo(
    courierId: string,
    userId: string
): Promise<DeliveryStatsWithUser> {
	try {
		// Obtener estadísticas de delivery
		const deliveryStats = await getDeliveryStatsByCourier(courierId);

		// Obtener datos del usuario
		const userData = await getUserData(userId);

		// Si no hay usuario, devolver solo estadísticas con valores por defecto
		if (!userData) {
			return {
				...deliveryStats,
				userRoles: [],
				userRole: null,
				isCourier: false,
				userData: null,
			};
		}

		// Determinar si es courier/repartidor
		const isCourier = userData.roles.some(
			(role) =>
				role === "repartidor" || role === "courier" || role === "delivery",
		);

		return {
			...deliveryStats,
			userRoles: userData.roles,
			userRole: userData.roles.length > 0 ? userData.roles[0] : null,
			isCourier,
			userData,
		};
	} catch (error) {
		console.error("Error fetching delivery stats with user info:", error);
		throw error;
	}
}

// ============================================
// FUNCIONES UTILITARIAS ADICIONALES
// ============================================

export async function getCourierDeliveryStatsWithUserCheck(
	userId: string,
): Promise<DeliveryStatsWithUser | null> {
    try {
        // Primero obtener el usuario para verificar que existe
        const userData = await getUserData(userId);

        if (!userData) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const isCourier = userData.roles.some(role =>
            role === 'mensajero'
        );

        if (!isCourier) {
            throw new Error(`User ${userId} is not a courier`);
        }

        const deliveryStats = await getDeliveryStatsByCourier(userId);

        return {
            ...deliveryStats,
            userRoles: userData.roles,
            userRole: userData.roles.length > 0 ? userData.roles[0] : null,
            isCourier: true,
            userData,
        };
    } catch (error) {
        console.error("Error fetching courier delivery stats:", error);
        throw error;
    }
}


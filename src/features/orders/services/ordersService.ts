import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  type Query,
  type DocumentData,
  updateDoc,
  onSnapshot,
  type QuerySnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import type { Order, OrderStatus, OrderItem, ReturnRequest } from "../types";

// --- Normalization Helpers (from main) ---

function normalizeStatusValue(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_\s-]+/g, '_');
}

function normalizeBuyerOrderStatus(data: Record<string, unknown>): OrderStatus {
  const deliveryStatus = normalizeStatusValue(data.deliveryStatus);
  const orderStatus = normalizeStatusValue(data.status);

  if (
    deliveryStatus === 'delivered' ||
    deliveryStatus === 'entregado' ||
    orderStatus === 'completado' ||
    orderStatus === 'entregado'
  ) {
    return 'delivered';
  }
  if (deliveryStatus === 'in_transit' || orderStatus === 'en_camino') return 'in_transit';
  if (
    deliveryStatus === 'accepted' ||
    deliveryStatus === 'assigned' ||
    orderStatus === 'aceptado' ||
    orderStatus === 'asignado' ||
    orderStatus === 'listo'
  ) {
    return 'preparing';
  }
  if (orderStatus === 'cancelado' || orderStatus === 'cancelled') return 'cancelled';

  return (data.status as OrderStatus) || 'pending';
}

function isDeliveredForReception(data: Record<string, unknown>) {
  const deliveryStatus = normalizeStatusValue(data.deliveryStatus);
  const orderStatus = normalizeStatusValue(data.status);

  return (
    deliveryStatus === 'delivered' ||
    deliveryStatus === 'entregado' ||
    orderStatus === 'entregado' ||
    orderStatus === 'completado'
  );
}

function isReceptionConfirmed(data: Record<string, unknown>) {
  return Boolean(data.buyerReceptionConfirmed || data.customerConfirmed);
}

// --- Seller Actions (from user branch) ---

export async function reserveOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe estar autenticado para reservar un pedido.");

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "RESERVADO",
    sellerId: user.uid
  });
}

export async function getSentOrders(): Promise<Order[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "orders"),
    where("sellerId", "==", user.uid),
    where("deliveryStatus", "in", ["in_transit", "delivered", "IN_TRANSIT", "DELIVERED", "Entregado"])
  );
  return fetchOrdersByQuery(q);
}

export async function getCreatedOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["CREADO", "RESERVADO", "EMPAQUETADO", "PENDIENTE"]),
    where("deliveryStatus", "==", null)
  );
  return fetchOrdersByQuery(q);
}

// --- Real-time Subscriptions (from user branch) ---

export function subscribeToCreatedOrders(onUpdate: (orders: Order[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["CREADO", "RESERVADO", "EMPAQUETADO", "PENDIENTE"]),
    where("deliveryStatus", "==", null)
  );

  return onSnapshot(q, async (querySnapshot) => {
    const orders = await processQuerySnapshot(querySnapshot);
    onUpdate(orders);
  });
}

// --- Internal Processing Logic (merged) ---

async function fetchOrdersByQuery(q: Query<DocumentData>): Promise<Order[]> {
  const querySnapshot = await getDocs(q);
  return processQuerySnapshot(querySnapshot);
}

async function processQuerySnapshot(querySnapshot: QuerySnapshot<DocumentData>): Promise<Order[]> {
  // Optimización: Obtener todas las ubicaciones únicas primero para evitar N+1
  const uniqueLocationIds = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => (doc.data() as any).locationId)
        .filter((id): id is string => !!id)
    )
  );

  const locationMap = new Map<string, string>();
  if (uniqueLocationIds.length > 0) {
    await Promise.all(
      uniqueLocationIds.map(async (id) => {
        const locSnap = await getDoc(doc(db, "locations", id));
        if (locSnap.exists()) {
          locationMap.set(id, (locSnap.data() as any).label || "Sin etiqueta");
        }
      })
    );
  }

  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data() as Record<string, any>;
    const destination = (data.locationId && locationMap.get(data.locationId)) || "Ubicación no encontrada";

    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = itemsSnapshot.docs.map(itemDoc => {
      const item = itemDoc.data();
      return {
        itemId: item.itemId ?? itemDoc.id,
        productId: item.productId,
        productName: item.productName,
        price: item.price ?? item.unitPrice ?? 0,
        quantity: item.quantity,
        subtotal: item.subtotal,
        description: item.description,
      };
    }) as OrderItem[];

    return {
      id: orderDoc.id,
      buyerId: data.buyerId ?? '',
      status: normalizeBuyerOrderStatus(data),
      buyerReceptionConfirmed: isReceptionConfirmed(data),
      buyerReceptionConfirmedAt: data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
      delivery: {
        destination
      },
      items,
      total: data.total,
      createdAt: data.createdAt
    };
  }));

  return orders.sort((a, b) => b.id.localeCompare(a.id));
}

// --- Buyer Actions (from main) ---

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return processQuerySnapshot(querySnapshot);
}

export async function confirmOrderReception(orderId: string, buyerId: string) {
  const orderRef = doc(db, "orders", orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("El pedido no existe.");
    }

    const data = orderSnap.data();

    if (data.buyerId !== buyerId) {
      throw new Error("No puedes confirmar la recepción de este pedido.");
    }

    if (!isDeliveredForReception(data)) {
      throw new Error("Solo puedes confirmar pedidos marcados como entregados.");
    }

    if (isReceptionConfirmed(data)) {
      throw new Error("La recepción de este pedido ya fue confirmada.");
    }

    const confirmedAt = serverTimestamp();

    transaction.update(orderRef, {
      buyerReceptionConfirmed: true,
      buyerReceptionConfirmedAt: confirmedAt,
      receptionStatus: "CONFIRMADO_POR_COMPRADOR",
      status: "COMPLETADO",
      updatedAt: confirmedAt,
    });
  });
}

export async function createReturnRequest(requestData: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) {
  try {
    const docRef = await addDoc(collection(db, "returns"), {
      ...requestData,
      status: 'pending_review',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la devolución:", error);
    throw error;
  }
}

export async function getMyReturns(userId: string): Promise<ReturnRequest[]> {
  const q = query(
    collection(db, "returns"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ReturnRequest[];
}

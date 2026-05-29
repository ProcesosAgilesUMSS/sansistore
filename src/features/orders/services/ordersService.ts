import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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

// --- Seller Actions ---

export async function reserveOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe estar autenticado para reservar un pedido.");

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "RESERVADO",
    sellerId: user.uid,
    updatedAt: serverTimestamp(),
  });
}

export async function readyOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "LISTO",
    updatedAt: serverTimestamp(),
  });
}

// --- Real-time Subscriptions ---

export function subscribeToCreatedOrders(onUpdate: (orders: Order[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "CREADO")
  );

  return onSnapshot(q, async (querySnapshot) => {
    const orders = await processQuerySnapshot(querySnapshot);
    onUpdate(orders);
  });
}

export function subscribeToSellerOrders(sellerId: string, onUpdate: (orders: Order[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("sellerId", "==", sellerId)
  );

  return onSnapshot(q, async (querySnapshot) => {
    const orders = await processQuerySnapshot(querySnapshot);
    onUpdate(orders);
  });
}

export async function getSentOrders(): Promise<Order[]> {
  return [];
}

// --- Internal Processing Logic ---


async function processQuerySnapshot(querySnapshot: QuerySnapshot<DocumentData>): Promise<Order[]> {
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
        itemId: itemDoc.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        description: item.description,
      };
    }) as OrderItem[];

    return {
      id: orderDoc.id,
      secret: data.secret,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      status: data.status as OrderStatus,
      buyerReceptionConfirmed: data.buyerReceptionConfirmed || data.customerConfirmed || false,
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

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return null;

  const data = orderSnap.data() as Record<string, any>;

  let destination = "Ubicación no encontrada";
  if (data.locationId) {
    const locSnap = await getDoc(doc(db, "locations", data.locationId));
    if (locSnap.exists()) {
      destination = (locSnap.data() as any).label || "Sin etiqueta";
    }
  }

  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = itemsSnapshot.docs.map((itemDoc) => {
    const item = itemDoc.data();
    return {
      itemId: itemDoc.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      description: item.description,
    };
  }) as OrderItem[];

  return {
    id: orderSnap.id,
    secret: data.secret,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    status: data.status as OrderStatus,
    buyerReceptionConfirmed: data.buyerReceptionConfirmed || data.customerConfirmed || false,
    buyerReceptionConfirmedAt:
      data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
    delivery: { destination },
    items,
    total: data.total,
    createdAt: data.createdAt,
  };
}

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

    if (data.status !== 'ENTREGADO' && data.deliveryStatus !== 'DELIVERED') {
      throw new Error("Solo puedes confirmar pedidos marcados como entregados.");
    }

    if (data.buyerReceptionConfirmed || data.customerConfirmed) {
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

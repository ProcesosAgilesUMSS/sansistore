import { collection, query, where, getDocs, doc, getDoc, type Query, type DocumentData, updateDoc, onSnapshot, type QuerySnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import type { Order, OrderStatus, OrderItem, ReturnRequest } from "../types";

interface FirestoreOrder {
  locationId?: string;
  deliveryStatus?: string;
  status: string;
  total?: number;
  buyerId?: string;
  createdAt?: any;
}

interface FirestoreLocation {
  label?: string;
}

interface FirestoreOrderItem {
  itemId?: string;
  productId: string;
  productName: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  subtotal: number;
  description?: string;
}

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
    where("deliveryStatus", "in", ["in_transit", "delivered"])
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

async function fetchOrdersByQuery(q: Query<DocumentData>): Promise<Order[]> {
  const querySnapshot = await getDocs(q);
  return processQuerySnapshot(querySnapshot);
}

async function processQuerySnapshot(querySnapshot: QuerySnapshot<DocumentData>): Promise<Order[]> {
  // Optimización: Obtener todas las ubicaciones únicas primero para evitar N+1
  const uniqueLocationIds = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => (doc.data() as FirestoreOrder).locationId)
        .filter((id): id is string => !!id)
    )
  );

  const locationMap = new Map<string, string>();
  if (uniqueLocationIds.length > 0) {
    await Promise.all(
      uniqueLocationIds.map(async (id) => {
        const locSnap = await getDoc(doc(db, "locations", id));
        if (locSnap.exists()) {
          locationMap.set(id, (locSnap.data() as FirestoreLocation).label || "Sin etiqueta");
        }
      })
    );
  }

  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data() as FirestoreOrder;
    const destination = (data.locationId && locationMap.get(data.locationId)) || "Ubicación no encontrada";

    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = itemsSnapshot.docs.map(itemDoc => {
      const itemData = itemDoc.data() as FirestoreOrderItem;
      return {
        itemId: itemData.itemId ?? itemDoc.id,
        productId: itemData.productId,
        productName: itemData.productName,
        price: itemData.price ?? itemData.unitPrice ?? 0,
        quantity: itemData.quantity,
        subtotal: itemData.subtotal,
        description: itemData.description
      };
    }) as OrderItem[];

    // Si deliveryStatus existe y no es "created", lo usamos como el estado visible.
    const orderStatus = (data.deliveryStatus ? data.deliveryStatus : data.status) as OrderStatus;

    return {
      id: orderDoc.id,
      buyerId: data.buyerId ?? '',
      status: orderStatus,
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

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return processQuerySnapshot(querySnapshot);
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

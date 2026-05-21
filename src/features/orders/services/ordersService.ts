import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { DocumentData, DocumentReference } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import type { Order, OrderItem, OrderStatus, ReturnRequest } from "../types";

async function getDestination(locationId?: string) {
  if (!locationId) return "Ubicacion no encontrada";

  const locSnap = await getDoc(doc(db, "locations", locationId));
  return locSnap.exists() ? locSnap.data().label || "Sin etiqueta" : "Sin etiqueta";
}

async function getOrderItems(orderRef: DocumentReference) {
  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));

  return itemsSnapshot.docs.map((itemDoc) => {
    const data = itemDoc.data();

    return {
      itemId: data.itemId ?? itemDoc.id,
      productId: data.productId,
      productName: data.productName,
      price: data.price ?? data.unitPrice ?? 0,
      unitPrice: data.unitPrice ?? data.price ?? 0,
      quantity: data.quantity,
      subtotal: data.subtotal,
      description: data.description,
    } satisfies OrderItem;
  });
}

async function getCustomerConfirmation(orderData: DocumentData) {
  let customerConfirmed = Boolean(orderData.customerConfirmed);
  let customerConfirmedAt = orderData.customerConfirmedAt?.toDate?.() ?? null;

  if (orderData.deliveryId) {
    const deliverySnap = await getDoc(doc(db, "deliveries", orderData.deliveryId));
    if (deliverySnap.exists()) {
      const deliveryData = deliverySnap.data();
      customerConfirmed = Boolean(deliveryData.customerConfirmed);
      customerConfirmedAt =
        deliveryData.customerConfirmedAt?.toDate?.() ?? customerConfirmedAt;
    }
  }

  return { customerConfirmed, customerConfirmedAt };
}

export async function getSentOrders(): Promise<Order[]> {
  const buyerId = auth.currentUser?.uid;
  if (!buyerId) return [];

  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", buyerId),
    where("deliveryStatus", "in", ["in_transit", "delivered"])
  );
  const querySnapshot = await getDocs(q);

  const orders = await Promise.all(
    querySnapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data();
      const confirmation = await getCustomerConfirmation(data);

      return {
        id: orderDoc.id,
        buyerId: data.buyerId,
        deliveryId: data.deliveryId ?? null,
        status: data.deliveryStatus as OrderStatus,
        delivery: {
          destination: await getDestination(data.locationId),
        },
        items: await getOrderItems(orderDoc.ref),
        total: data.total,
        createdAt: data.createdAt ?? undefined,
        ...confirmation,
      };
    })
  );

  return orders;
}

export async function confirmOrderReceived(order: Order): Promise<Date> {
  const buyerId = auth.currentUser?.uid;
  if (!buyerId) {
    throw new Error("Debes iniciar sesion para confirmar la recepcion.");
  }
  if (!order.deliveryId) {
    throw new Error("El pedido no tiene una entrega asociada.");
  }

  const confirmedAt = new Date();
  const orderRef = doc(db, "orders", order.id);
  const deliveryRef = doc(db, "deliveries", order.deliveryId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    const deliverySnap = await transaction.get(deliveryRef);

    if (!orderSnap.exists()) {
      throw new Error("El pedido no existe.");
    }
    if (!deliverySnap.exists()) {
      throw new Error("La entrega no existe.");
    }

    const orderData = orderSnap.data();
    const deliveryData = deliverySnap.data();

    if (orderData.buyerId !== buyerId) {
      throw new Error("No puedes confirmar un pedido de otro comprador.");
    }
    if (orderData.deliveryStatus !== "delivered") {
      throw new Error("Solo puedes confirmar pedidos marcados como entregados.");
    }
    if (deliveryData.customerConfirmed) {
      throw new Error("Este pedido ya fue confirmado.");
    }

    transaction.update(deliveryRef, {
      customerConfirmed: true,
      customerConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(orderRef, {
      customerConfirmed: true,
      customerConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return confirmedAt;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const orders = await Promise.all(
    querySnapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data();
      const confirmation = await getCustomerConfirmation(data);

      return {
        id: orderDoc.id,
        buyerId: data.buyerId,
        deliveryId: data.deliveryId ?? null,
        status: (data.deliveryStatus ?? data.status) as OrderStatus,
        delivery: {
          destination: await getDestination(data.locationId),
        },
        items: await getOrderItems(orderDoc.ref),
        total: data.total || 0,
        createdAt: data.createdAt ?? undefined,
        ...confirmation,
      };
    })
  );

  return orders;
}

export async function createReturnRequest(
  requestData: Omit<ReturnRequest, "id" | "createdAt" | "status">
) {
  try {
    const docRef = await addDoc(collection(db, "returns"), {
      ...requestData,
      status: "pending_review",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la devolucion:", error);
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
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ReturnRequest[];
}

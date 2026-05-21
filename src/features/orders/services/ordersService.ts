import { collection, query, where, getDocs, doc, getDoc, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Order, OrderStatus, OrderItem } from "../types";

export async function getSentOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("deliveryStatus", "in", ["in_transit", "delivered"])
  );
  const querySnapshot = await getDocs(q);

  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data();
    let destination = "Ubicación no encontrada";
    if (data.locationId) {
      const locRef = doc(db, "locations", data.locationId);
      const locSnap = await getDoc(locRef);
      if (locSnap.exists()) {
        destination = locSnap.data().label || "Sin etiqueta";
      }
    }
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
      status: data.deliveryStatus as OrderStatus,
      delivery: {
        destination: destination
      },
      items,
      total: data.total
    };
  }));

  return orders;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data();
    let destination = "Ubicación no encontrada";
    if (data.locationId) {
      const locRef = doc(db, "locations", data.locationId);
      const locSnap = await getDoc(locRef);
      if (locSnap.exists()) {
        destination = locSnap.data().label || "Sin etiqueta";
      }
    }
    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = itemsSnapshot.docs.map(itemDoc => ({
      itemId: itemDoc.id,
      ...itemDoc.data()
    })) as OrderItem[];
    return {
      id: orderDoc.id,
      buyerId: data.buyerId,
      status: data.status as OrderStatus,
      delivery: {
        destination: destination
      },
      items,
      total: data.total || 0,
      createdAt: data.createdAt
    };
  }));

  return orders;
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

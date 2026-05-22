import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Order, OrderStatus, OrderItem, ReturnRequest } from "../types";

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

  return 'pending';
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

export async function getSentOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("deliveryStatus", "in", ["in_transit", "delivered", "IN_TRANSIT", "DELIVERED", "Entregado"])
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
      buyerId: data.buyerId,
      status: normalizeBuyerOrderStatus(data),
      buyerReceptionConfirmed: isReceptionConfirmed(data),
      buyerReceptionConfirmedAt: data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
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
      status: normalizeBuyerOrderStatus(data),
      buyerReceptionConfirmed: isReceptionConfirmed(data),
      buyerReceptionConfirmedAt: data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
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

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Order, OrderDoc, OrderItem, OrderItemDoc } from '../types';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
}

function docToOrder(id: string, data: OrderDoc): Order {
  return {
    orderId: id,
    buyerId: data.buyerId ?? '',
    sellerId: data.sellerId ?? '',
    status: data.status,
    total: data.total ?? 0,
    locationId: data.locationId ?? '',
    paymentStatus: data.paymentStatus ?? '',
    deliveryStatus: data.deliveryStatus ?? null,
    deliveryId: data.deliveryId ?? null,
    incidentReason: data.incidentReason ?? null,
    confirmedAt: toDate(data.confirmedAt),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

async function fetchBuyersData(
  db: Firestore,
  buyerIds: string[],
): Promise<Record<string, string>> {
  if (buyerIds.length === 0) return {};

  try {
    const map: Record<string, string> = {};
    const userSnapshots = await Promise.all(
      buyerIds.map((uid) => getDoc(doc(db, 'users', uid))),
    );

    userSnapshots.forEach((userSnap) => {
      if (!userSnap.exists()) return;
      const data = userSnap.data();
      map[userSnap.id] = data.displayName ?? data.email ?? 'Comprador desconocido';
    });

    return map;
  } catch {
    console.error('Error al obtener a los compradores');
    return {};
  }
}

async function fetchLocationsData(
  db: Firestore,
  locationIds: string[],
): Promise<Record<string, string>> {
  if (locationIds.length === 0) return {};

  try {
    const map: Record<string, string> = {};
    const locationSnapshots = await Promise.all(
      locationIds.map((locId) => getDoc(doc(db, 'locations', locId))),
    );

    locationSnapshots.forEach((locSnap) => {
      if (!locSnap.exists()) return;
      const data = locSnap.data();
      map[locSnap.id] = data.label ?? 'Ubicacion desconocida';
    });

    return map;
  } catch {
    console.error('Error al obtener las ubicaciones');
    return {};
  }
}

async function enrichOrdersWithData(
  db: Firestore,
  orders: Order[],
): Promise<Order[]> {
  if (orders.length === 0) return [];

  const buyerIds = [...new Set(orders.map((order) => order.buyerId))];
  const locationIds = [...new Set(orders.map((order) => order.locationId))];

  const [buyerMap, locationMap] = await Promise.all([
    fetchBuyersData(db, buyerIds),
    fetchLocationsData(db, locationIds),
  ]);

  return orders.map((order) => ({
    ...order,
    buyerName: buyerMap[order.buyerId],
    locationLabel: locationMap[order.locationId],
  }));
}

export async function fetchOrderItems(
  db: Firestore,
  orderId: string,
): Promise<OrderItem[]> {
  const itemsRef = collection(db, 'orders', orderId, 'orderItems');
  const snap = await getDocs(itemsRef);

  return snap.docs.map((itemDoc) => {
    const data = itemDoc.data() as OrderItemDoc;
    return {
      itemId: itemDoc.id,
      productId: data.productId,
      productName: data.productName,
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      subtotal: data.subtotal,
    };
  });
}

export function subscribeConfirmedOrders(
  db: Firestore,
  sellerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'CREADO'),
  );

  return onSnapshot(
    q,
    async (snap) => {
      const orders = snap.docs.map((orderDoc) =>
        docToOrder(orderDoc.id, orderDoc.data() as OrderDoc),
      );
      const enriched = await enrichOrdersWithData(db, orders);
      onData(enriched);
    },
    (err) => onError?.(err),
  );
}

export function subscribeReservedOrders(
  db: Firestore,
  sellerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'RESERVADO'),
  );

  return onSnapshot(
    q,
    async (snap) => {
      const orders = snap.docs.map((orderDoc) =>
        docToOrder(orderDoc.id, orderDoc.data() as OrderDoc),
      );
      const enriched = await enrichOrdersWithData(db, orders);
      onData(enriched);
    },
    (err) => onError?.(err),
  );
}

export async function reserveConfirmedOrder(
  db: Firestore,
  orderId: string,
  sellerId: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const current = orderSnap.data();

    if (current.status !== 'CREADO') {
      throw new Error(`El pedido ya no esta en CREADO (estado actual: ${current.status}).`);
    }

    tx.update(orderRef, {
      status: 'RESERVADO',
      sellerId,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

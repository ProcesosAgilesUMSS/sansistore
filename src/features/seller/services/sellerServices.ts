import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  runTransaction,
  serverTimestamp,
  getDoc,
  updateDoc,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderItem, OrderDoc, OrderItemDoc, Messenger } from '../types';


function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
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

async function enrichOrdersWithData(
  db: Firestore,
  orders: Order[],
): Promise<Order[]> {
  if (orders.length === 0) return [];

  const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
  const locationIds = [...new Set(orders.map((o) => o.locationId))];

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

async function fetchBuyersData(
  db: Firestore,
  buyerIds: string[],
): Promise<Record<string, string>> {
  if (buyerIds.length === 0) return {};

  try {
    const map: Record<string, string> = {};

    const userSnapshots = await Promise.all(
      buyerIds.map((uid) => getDoc(doc(db, 'users', uid)))
    );

    userSnapshots.forEach((userSnap) => {
      if (userSnap.exists()) {
        const data = userSnap.data();
        map[userSnap.id] = data.displayName ?? data.email ?? 'Comprador desconocido';
      }
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
      locationIds.map((locId) => getDoc(doc(db, 'locations', locId)))
    );

    locationSnapshots.forEach((locSnap) => {
      if (locSnap.exists()) {
        const data = locSnap.data();
        map[locSnap.id] = data.label ?? 'Ubicación desconocida';
      }
    });

    return map;
  } catch {
    console.error('Error al obtener la localizacióin');
    return {};
  }
}


export function subscribeSellerOrders(
  db: Firestore,
  sellerId: string,
  onData: (reserved: Order[], ready: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {

  const ordersRef = collection(db, 'orders');

  let reserved: Order[] = [];
  let ready: Order[] = [];
  let firstReservedLoaded = false;
  let firstReadyLoaded = false;

  const emit = async () => {
    if (firstReservedLoaded && firstReadyLoaded) {
      const enrichedReserved = await enrichOrdersWithData(db, [...reserved]);
      const enrichedReady = await enrichOrdersWithData(db, [...ready]);
      onData(enrichedReserved, enrichedReady);
    }
  };

  const qReserved = query(
    ordersRef,
    where('status', '==', 'CONFIRMADO'),
  );

  const qReady = query(
    ordersRef,
    where('sellerId', '==', sellerId),
    where('status', '==', 'LISTO'),
  );

  const unsubReserved = onSnapshot(
    qReserved,
    (snap) => {
      reserved = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
      firstReservedLoaded = true;
      emit();
    },
    (err) => onError?.(err),
  );

  const unsubReady = onSnapshot(
    qReady,
    (snap) => {
      ready = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
      firstReadyLoaded = true;
      emit();
    },
    (err) => onError?.(err),
  );

  return () => {
    unsubReserved();
    unsubReady();
  };
}


export async function fetchOrderItems(
  db: Firestore,
  orderId: string,
): Promise<OrderItem[]> {
  const itemsRef = collection(db, 'orders', orderId, 'orderItems');
  const snap = await getDocs(itemsRef);
  return snap.docs.map((d) => {
    const data = d.data() as OrderItemDoc;
    return {
      itemId: d.id,
      productId: data.productId,
      productName: data.productName,
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      subtotal: data.subtotal,
    };
  });
}

export async function markOrderAsReady(
  db: Firestore,
  orderId: string,
  sellerId: string,
): Promise<{ deliveryId: string }> {

  const orderRef = doc(db, 'orders', orderId);

  const deliveryRef = doc(collection(db, 'deliveries'));
  const deliveryId = deliveryRef.id;
  const deliveryCode = `DEL-${Date.now().toString(36).toUpperCase()}`;

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const current = orderSnap.data();

    if (current.status !== 'CONFIRMADO') {
      throw new Error(
        `El pedido ya no está en CONFIRMADO (estado actual: ${current.status}).`,
      );
    }

    tx.update(orderRef, {
      status: 'LISTO',
      deliveryStatus: 'CREADO',
      deliveryId,
      sellerId,
      updatedAt: serverTimestamp(),
    });

    tx.set(deliveryRef, {
      orderId,
      courierId: null,
      status: 'CREADO',
      deliveryCode,
      attemptNumber: 1,
      incidentReason: null,
      evidenceUrl: null,
      failureReason: null,
      amountCollected: null,
      customerConfirmed: false,
      customerConfirmedAt: null,
      assignedAt: null,
      pickedUpAt: null,
      inTransitAt: null,
      deliveredAt: null,
      failedAt: null,
      reprogrammedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { deliveryId };
}

export function subscribeAssignedOrders(
  db: Firestore,
  sellerId: string,
  onData: (assigned: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'ASIGNADO'),
  );

  return onSnapshot(
    q,
    async (snap) => {
      const orders = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
      const enriched = await enrichOrdersWithData(db, orders);
      onData(enriched);
    },
    (err) => onError?.(err),
  );
}

export async function unassignCourierFromDelivery(
  db: Firestore,
  deliveryId: string,
  orderId: string,
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'deliveries', deliveryId), {
      courierId: null,
      status: 'CREADO',
      assignedAt: null,
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'orders', orderId), {
      status: 'LISTO',
      deliveryStatus: 'CREADO',
      updatedAt: serverTimestamp(),
    }),
  ]);
}

export async function fetchMessengers(db: Firestore): Promise<Messenger[]> {
  const q = query(
    collection(db, 'users'),
    where('roles', 'array-contains', 'mensajero'),
    where('isActive', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName ?? data.email ?? 'Mensajero',
      institutionalId: data.institutionalId ?? '',
    };
  });
}

export async function assignCourierToDelivery(
  db: Firestore,
  deliveryId: string,
  orderId: string,
  courierId: string,
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'deliveries', deliveryId), {
      courierId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'orders', orderId), {
      status: 'ASIGNADO',
      deliveryStatus: 'ASIGNADO',
      updatedAt: serverTimestamp(),
    }),
  ]);
}

export async function reassignCourierToDelivery(
  db: Firestore,
  deliveryId: string,
  orderId: string,
  newCourierId: string,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    const orderRef = doc(db, 'orders', orderId);

    const deliverySnap = await tx.get(deliveryRef);
    const orderSnap = await tx.get(orderRef);

    if (!deliverySnap.exists()) throw new Error('Delivery no existe.');
    if (!orderSnap.exists()) throw new Error('Order no existe.');

    const deliveryData: any = deliverySnap.data();
    const orderData: any = orderSnap.data();

    if (orderData.status !== 'ASIGNADO') {
      throw new Error('No se puede reasignar: la orden no está en estado ASIGNADO.');
    }

    tx.update(deliveryRef, {
      courierId: newCourierId,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(orderRef, {
      updatedAt: serverTimestamp(),
    });
  });
}

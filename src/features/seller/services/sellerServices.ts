import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
  type Firestore,
  orderBy,
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
    paymentId: data.paymentId ?? null,
    deliveryStatus: data.deliveryStatus ?? null,
    deliveryId: data.deliveryId ?? null,
    deliveryCode: data.deliveryCode ?? null,
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
    buyerName: buyerMap[order.buyerId]?.displayName,
    buyerEmail: buyerMap[order.buyerId]?.email,
    buyerInstitutionalId: buyerMap[order.buyerId]?.institutionalId,
    locationLabel: locationMap[order.locationId]?.label,
    locationType: locationMap[order.locationId]?.type,
  }));
}

async function fetchBuyersData(
  db: Firestore,
  buyerIds: string[],
): Promise<Record<string, { displayName: string; email: string; institutionalId: string }>> {
  if (buyerIds.length === 0) return {};

  try {
    const map: Record<string, { displayName: string; email: string; institutionalId: string }> = {};

    const userSnapshots = await Promise.all(
      buyerIds.map((uid) => getDoc(doc(db, 'users', uid)))
    );

    userSnapshots.forEach((userSnap) => {
      if (userSnap.exists()) {
        const data = userSnap.data();
        map[userSnap.id] = {
          displayName: data.displayName ?? data.email ?? 'Comprador desconocido',
          email: data.email ?? '',
          institutionalId: data.institutionalId ?? '',
        };
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
): Promise<Record<string, { label: string; type: string }>> {
  if (locationIds.length === 0) return {};

  try {
    const map: Record<string, { label: string; type: string }> = {};

    const locationSnapshots = await Promise.all(
      locationIds.map((locId) => getDoc(doc(db, 'locations', locId)))
    );

    locationSnapshots.forEach((locSnap) => {
      if (locSnap.exists()) {
        const data = locSnap.data();
        map[locSnap.id] = {
          label: data.label ?? 'Ubicación desconocida',
          type: data.type ?? '',
        };
      }
    });

    return map;
  } catch {
    console.error('Error al obtener la localizacióin');
    return {};
  }
}

async function fetchPaymentData(
  db: Firestore,
  paymentId: string | null | undefined,
): Promise<{ paymentMethod: string | null; paymentAmount: number | null } | null> {
  if (!paymentId) return null;

  try {
    const paymentSnap = await getDoc(doc(db, 'payments', paymentId));

    if (!paymentSnap.exists()) return null;

    const data = paymentSnap.data() as { method?: string; amount?: number };

    return {
      paymentMethod: data.method ?? null,
      paymentAmount: typeof data.amount === 'number' ? data.amount : null,
    };
  } catch {
    return null;
  }
}

export async function fetchDeliveryData(
  db: Firestore,
  deliveryId: string | null | undefined,
): Promise<{ deliveryCode: string | null; deliveryCourierName: string | null; deliveryCourierInstitutionalId: string | null } | null> {
  if (!deliveryId) return null;

  try {
    const deliverySnap = await getDoc(doc(db, 'deliveries', deliveryId));

    if (!deliverySnap.exists()) return null;

    const data = deliverySnap.data() as { deliveryCode?: string; courierId?: string | null };
    let deliveryCourierName: string | null = null;
    let deliveryCourierInstitutionalId: string | null = null;

    if (data.courierId) {
      const courierSnap = await getDoc(doc(db, 'users', data.courierId));
      if (courierSnap.exists()) {
        const courierData = courierSnap.data();
        deliveryCourierName = courierData.displayName ?? courierData.email ?? 'Mensajero';
        deliveryCourierInstitutionalId = courierData.institutionalId ?? '';
      }
    }

    return {
      deliveryCode: data.deliveryCode ?? null,
      deliveryCourierName,
      deliveryCourierInstitutionalId,
      courierId: data.courierId ?? null,
    } as any;
  } catch {
    return null;
  }
}

export function subscribeRejectedOrders(
  db: Firestore,
  sellerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'PENDIENTE REASIGNACION'),
    orderBy('updatedAt', 'desc'),
  );

  return onSnapshot(
    q,
    async (snap) => {
      try {
        const orders = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
        console.debug('[sellerServices] subscribeRejectedOrders snapshot size:', snap.size);
        const enriched = await enrichOrdersWithData(db, orders);
        onData(enriched);
      } catch (err) {
        console.error('[sellerServices] subscribeRejectedOrders error:', err);
        onError?.(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    (err) => onError?.(err),
  );
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
    where('sellerId', '==', sellerId),
    where('status', '==', 'EMPAQUETADO'),
    orderBy('updatedAt', 'desc'),
  )

  const qReady = query(
    ordersRef,
    where('sellerId', '==', sellerId),
    where('status', '==', 'LISTO'),
    orderBy('updatedAt', 'desc'),
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

export async function fetchOrderDetails(
  db: Firestore,
  orderId: string,
): Promise<Order> {
  const orderSnap = await getDoc(doc(db, 'orders', orderId));

  if (!orderSnap.exists()) {
    throw new Error('El pedido no existe.');
  }

  const order = docToOrder(orderSnap.id, orderSnap.data() as OrderDoc);
  const [items, buyerMap, locationMap, paymentData, deliveryData] = await Promise.all([
    fetchOrderItems(db, orderId),
    fetchBuyersData(db, order.buyerId ? [order.buyerId] : []),
    fetchLocationsData(db, order.locationId ? [order.locationId] : []),
    fetchPaymentData(db, order.paymentId),
    fetchDeliveryData(db, order.deliveryId),
  ]);

  const buyer = buyerMap[order.buyerId];
  const location = locationMap[order.locationId];

  return {
    ...order,
    buyerName: buyer?.displayName,
    buyerEmail: buyer?.email,
    buyerInstitutionalId: buyer?.institutionalId,
    locationLabel: location?.label,
    locationType: location?.type,
    paymentMethod: paymentData?.paymentMethod ?? null,
    paymentAmount: paymentData?.paymentAmount ?? null,
    deliveryCode: deliveryData?.deliveryCode ?? null,
    deliveryCourierName: deliveryData?.deliveryCourierName ?? null,
    deliveryCourierInstitutionalId: deliveryData?.deliveryCourierInstitutionalId ?? null,
    items,
  };
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

    if (current.status !== 'EMPAQUETADO') {
      throw new Error(
        `El pedido ya no está en EMPAQUETADO (estado actual: ${current.status}).`,
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

export function subscribeConfirmedOrders(
  db: Firestore,
  sellerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'EMPAQUETADO'),
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
      const orders = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
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

    if (current.status !== 'EMPAQUETADO') {
      throw new Error(
        `El pedido ya no está en EMPAQUETADO (estado actual: ${current.status}).`,
      );
    }

    tx.update(orderRef, {
      status: 'RESERVADO',
      sellerId,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
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

export function subscribePaidOrders(
  db: Firestore,
  sellerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'PAGADO'),
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

export async function reassignCourierFromPending(
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

    const orderData: any = orderSnap.data();

    if (orderData.status !== 'PENDIENTE REASIGNACION') {
      throw new Error('No se puede reasignar: la orden no está en PENDIENTE REASIGNACION.');
    }

    tx.update(deliveryRef, {
      courierId: newCourierId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(orderRef, {
      status: 'ASIGNADO',
      deliveryStatus: 'ASIGNADO',
      updatedAt: serverTimestamp(),
    });
  });
}

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderItem, OrderDoc, OrderItemDoc } from '../types';


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

  const emit = () => {
    if (firstReservedLoaded && firstReadyLoaded) {
      onData([...reserved], [...ready]);
    }
  };

  const qReserved = query(
    ordersRef,
    where('sellerId', '==', sellerId),
    where('status', '==', 'RESERVADO'),
    orderBy('confirmedAt', 'asc'),
  );

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

    if (current.status !== 'RESERVADO') {
      throw new Error(
        `El pedido ya no está en RESERVADO (estado actual: ${current.status}).`,
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

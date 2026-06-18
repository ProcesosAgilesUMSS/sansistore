import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderDoc } from '../types';
import type { DeliveryData } from '../types/pendingOrders';


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


export async function fetchDeliveryData(
  db: Firestore,
  deliveryId: string | null | undefined,
): Promise<DeliveryData | null> {
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
    };
  } catch {
    return null;
  }
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


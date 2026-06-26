import { collection, doc, getDocs, query, where, onSnapshot, getDoc, type Unsubscribe, type Firestore, orderBy } from "firebase/firestore";
import { docToOrder } from '../adapter/orders'
import type { Order, OrderDoc, OrderItem, OrderItemDoc } from "../types";

const orderItemsCache = new Map<string, OrderItem[]>();

interface Params {
  status: string;
  ordby: 'asc' | 'desc';
  db: Firestore
  sellerId: string;
  onData: (order: Order[]) => void,
  onError: (error: string) => void,
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

async function fetchBuyersData(
  db: Firestore,
  buyerIds: string[],
): Promise<Record<string, { displayName: string; email: string; institutionalId: string; ci: string }>> {
  if (buyerIds.length === 0) return {};

  try {
    const map: Record<string, { displayName: string; email: string; institutionalId: string; ci: string }> = {};

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
          ci: data.ci ?? '',
        };
      }
    });

    return map;
  } catch {
    console.error('Error al obtener a los compradores');
    return {};
  }
}

async function fetchOrderItems(
  db: Firestore,
  orderId: string,
): Promise<OrderItem[]> {
  const cachedItems = orderItemsCache.get(orderId);
  if (cachedItems) return cachedItems;

  try {
    const itemsRef = collection(db, 'orders', orderId, 'orderItems');
    const snap = await getDocs(itemsRef);

    const items = snap.docs.map((itemDoc) => {
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

    orderItemsCache.set(orderId, items);
    return items;
  } catch {
    console.error('Error al obtener los productos del pedido', orderId);
    return [];
  }
}
async function enrichOrdersWithData(
  db: Firestore,
  orders: Order[],
): Promise<Order[]> {

  if (orders.length === 0) return [];

  const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
  const locationIds = [...new Set(orders.map((o) => o.locationId))];

  const itemsEntriesPromise = Promise.all(
    orders.map(async (order) => {
      const items = await fetchOrderItems(db, order.orderId);
      return [order.orderId, items] as const;
    }),
  );

  const [buyerMap, locationMap, itemsEntries] = await Promise.all([
    fetchBuyersData(db, buyerIds),
    fetchLocationsData(db, locationIds),
    itemsEntriesPromise,
  ]);

  const itemsMap = Object.fromEntries(itemsEntries) as Record<string, OrderItem[]>;

  return orders.map((order) => ({
    ...order,
    buyerName: buyerMap[order.buyerId]?.displayName,
    buyerEmail: buyerMap[order.buyerId]?.email,
    buyerInstitutionalId: buyerMap[order.buyerId]?.institutionalId,
    buyerCi: buyerMap[order.buyerId]?.ci,
    locationLabel: locationMap[order.locationId]?.label,
    locationType: locationMap[order.locationId]?.type,
    items: itemsMap[order.orderId] ?? [],
  }));
}

export const getOredrs = ({ status, ordby, db, sellerId, onData, onError }: Params): Unsubscribe => {
  const qOrders = query(
    collection(db, 'orders'),
    where('sellerId', '==', sellerId),
    where('status', '==', status),
    orderBy('updatedAt', ordby),
  )

  return onSnapshot(
    qOrders,
    async (snap) => {
      const orders = snap.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
      const enriched = await enrichOrdersWithData(db, orders);
      onData(enriched);
    },
    () => onError('Ocurrio un error al cargar los pedidos')
  )

}

export const getOrders = getOredrs;


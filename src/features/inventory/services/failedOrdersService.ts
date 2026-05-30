import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Estados que consideramos un pedido fallido.
export const FAILED_STATUSES = ['NO ENTREGADO', 'CANCELADO'] as const;

export type FailedOrderType = 'NO ENTREGADO' | 'CANCELADO';

export interface FailedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface FailedOrder {
  id: string;
  customerName: string;
  zone: string;
  total: number;
  type: FailedOrderType;
  reason: string | null;
  failedAt: Date | null;
  stockRestored: boolean;
  items: FailedOrderItem[];
}

type FailedOrderDoc = Record<string, unknown>;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function readItems(orderId: string): Promise<FailedOrderItem[]> {
  const snap = await getDocs(collection(db, 'orders', orderId, 'orderItems'));
  return snap.docs.map((itemDoc) => {
    const data = itemDoc.data();
    return {
      productId: String(data.productId || ''),
      productName: String(data.productName || 'Producto'),
      quantity: Number(data.quantity || 0),
    };
  });
}

async function readFailureContext(data: FailedOrderDoc): Promise<FailedOrderDoc> {
  const deliveryId =
    typeof data.deliveryId === 'string' && data.deliveryId ? data.deliveryId : null;

  if (!deliveryId) return {};

  const deliverySnap = await getDoc(doc(db, 'deliveries', deliveryId));
  if (!deliverySnap.exists()) return {};

  return deliverySnap.data() as FailedOrderDoc;
}

async function mapFailedOrder(
  orderId: string,
  data: FailedOrderDoc
): Promise<FailedOrder> {
  const items = await readItems(orderId);
  const failureContext = await readFailureContext(data);
  const isCancelled = String(data.status) === 'CANCELADO';

  return {
    id: orderId,
    customerName: String(data.customerName || data.buyerName || 'Cliente'),
    zone: String(data.deliveryZone || data.city || 'Sin zona'),
    total: Number(data.total || 0),
    type: isCancelled ? 'CANCELADO' : 'NO ENTREGADO',
    reason:
      (typeof data.incidentReason === 'string' && data.incidentReason) ||
      (typeof data.incidentNotes === 'string' && data.incidentNotes) ||
      (typeof failureContext.incidentReason === 'string' &&
        failureContext.incidentReason) ||
      (typeof failureContext.incidentNotes === 'string' &&
        failureContext.incidentNotes) ||
      (typeof failureContext.cancellationReason === 'string' &&
        failureContext.cancellationReason) ||
      (typeof failureContext.cancellationNotes === 'string' &&
        failureContext.cancellationNotes) ||
      null,
    failedAt: toDate(
      data.failedAt ??
        failureContext.failedAt ??
        failureContext.reportedAt ??
        data.cancelledAt ??
        failureContext.cancelledAt ??
        data.updatedAt
    ),
    stockRestored: Boolean(data.stockRestored),
    items,
  };
}

/**
 * Escucha en tiempo real los pedidos con fallo (no entregados y cancelados),
 * ordenados con los más recientes primero.
 */
export function subscribeFailedOrders(
  onChange: (orders: FailedOrder[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const failedStatusQuery = query(
    collection(db, 'orders'),
    where('status', 'in', [...FAILED_STATUSES])
  );
  const failedDeliveryQuery = query(
    collection(db, 'orders'),
    where('deliveryStatus', '==', 'NOT_DELIVERED')
  );

  let statusDocs = new Map<string, FailedOrderDoc>();
  let deliveryDocs = new Map<string, FailedOrderDoc>();
  let statusReady = false;
  let deliveryReady = false;
  let active = true;

  const emit = async () => {
    if (!active || !statusReady || !deliveryReady) return;

    try {
      const mergedDocs = new Map<string, FailedOrderDoc>([
        ...statusDocs.entries(),
        ...deliveryDocs.entries(),
      ]);
      const orders = await Promise.all(
        [...mergedDocs.entries()].map(([orderId, data]) =>
          mapFailedOrder(orderId, data)
        )
      );

      orders.sort(
        (a, b) => (b.failedAt?.getTime() ?? 0) - (a.failedAt?.getTime() ?? 0)
      );
      onChange(orders);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error
          : new Error('No se pudieron leer los pedidos con fallo.')
      );
    }
  };

  const unsubscribeByStatus = onSnapshot(
    failedStatusQuery,
    (snapshot) => {
      statusDocs = new Map(
        snapshot.docs.map((orderDoc) => [orderDoc.id, orderDoc.data()])
      );
      statusReady = true;
      void emit();
    },
    (error) => onError?.(error)
  );

  const unsubscribeByDelivery = onSnapshot(
    failedDeliveryQuery,
    (snapshot) => {
      deliveryDocs = new Map(
        snapshot.docs.map((orderDoc) => [orderDoc.id, orderDoc.data()])
      );
      deliveryReady = true;
      void emit();
    },
    (error) => onError?.(error)
  );

  return () => {
    active = false;
    unsubscribeByStatus();
    unsubscribeByDelivery();
  };
}

/**
 * Devuelve al inventario los productos de un pedido fallido.
 * - Suma las cantidades a stockTotal/stockAvailable de cada producto.
 * - Registra un movimiento ENTRADA por producto en inventoryMovements.
 * - Marca el pedido como stockRestored para impedir reposiciones duplicadas.
 */
export async function restoreStockForOrder(
  order: FailedOrder,
  operatorId: string
): Promise<void> {
  // Relectura de seguridad: evita reponer dos veces si otro tab ya lo hizo.
  const orderSnap = await getDoc(doc(db, 'orders', order.id));
  if (orderSnap.exists() && orderSnap.data().stockRestored) {
    throw new Error('El stock de este pedido ya fue repuesto.');
  }

  const restorable = order.items.filter(
    (item) => item.productId && item.quantity > 0
  );
  if (restorable.length === 0) {
    throw new Error('El pedido no tiene productos para reponer.');
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const item of restorable) {
    const inventoryRef = doc(db, 'inventory', item.productId);
    batch.set(
      inventoryRef,
      {
        stockTotal: increment(item.quantity),
        stockAvailable: increment(item.quantity),
        updatedAt: now,
      },
      { merge: true }
    );

    const movementRef = doc(collection(db, 'inventoryMovements'));
    batch.set(movementRef, {
      productId: item.productId,
      type: 'ENTRADA',
      quantity: item.quantity,
      operatorId,
      reason: `Reposición por pedido fallido ${order.id}`,
      date: now,
    });
  }

  batch.update(doc(db, 'orders', order.id), {
    stockRestored: true,
    stockRestoredBy: operatorId,
    stockRestoredAt: now,
    updatedAt: now,
  });

  await batch.commit();
}

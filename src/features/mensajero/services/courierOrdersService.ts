import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type {
  CourierDashboardStats,
  CourierOrder,
  CourierOrderItem,
} from '../types';

const ORDERS_COLLECTION = 'orders';
const PAYMENTS_COLLECTION = 'payments';

const mapOrder = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
  index: number
): CourierOrder => {
  const data = snapshot.data();
  const createdAt = data.createdAt?.toDate?.() ?? null;
  const deliveredAt = data.deliveredAt?.toDate?.() ?? null;
  const paymentCollectedAt = data.paymentCollectedAt?.toDate?.() ?? null;

  return {
    id: snapshot.id,
    orderCode:
      data.orderCode ??
      `ORD-${createdAt?.getFullYear() ?? new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    buyerName: data.buyerName ?? 'Comprador invitado',
    deliveryZone: data.deliveryZone ?? 'Zona pendiente',
    productsTotal:
      typeof data.productsTotal === 'number'
        ? data.productsTotal
        : typeof data.total === 'number'
          ? data.total
          : 0,
    additionalCharges:
      typeof data.additionalCharges === 'number' ? data.additionalCharges : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    status: data.status ?? 'Pendiente',
    paymentStatus: data.paymentStatus ?? 'Pendiente',
    paymentStatusLabel: data.paymentStatusLabel ?? 'Pendiente de cobro',
    paymentMethod: data.paymentMethod ?? 'Contra entrega',
    deliveryMethod: data.deliveryMethod ?? 'Delivery',
    specialInstructions: data.specialInstructions ?? 'Ninguna',
    paymentId: typeof data.paymentId === 'string' ? data.paymentId : null,
    createdAt,
    deliveredAt,
    deliveryLat: typeof data.deliveryLat === 'number' ? data.deliveryLat : null,
    deliveryLng: typeof data.deliveryLng === 'number' ? data.deliveryLng : null,
    items: Array.isArray(data.items)
      ? (data.items as CourierOrderItem[])
      : [],
    paymentCollectedAt,  // NUEVO
    collectedBy: data.collectedBy ?? undefined,  // NUEVO
  };
};

const buildStats = (orders: CourierOrder[]): CourierDashboardStats => {
  const now = new Date();

  return orders.reduce<CourierDashboardStats>(
    (stats, order) => {
      if (order.status !== 'Entregado') {
        stats.pendingCount += 1;
        stats.pendingCashTotal += order.total;
      }

      if (
        order.status === 'Entregado' &&
        order.deliveredAt &&
        order.deliveredAt.getFullYear() === now.getFullYear() &&
        order.deliveredAt.getMonth() === now.getMonth() &&
        order.deliveredAt.getDate() === now.getDate()
      ) {
        stats.deliveredTodayCount += 1;
      }

      return stats;
    },
    {
      pendingCount: 0,
      deliveredTodayCount: 0,
      pendingCashTotal: 0,
    }
  );
};

export const subscribeToCourierOrders = (
  onChange: (payload: {
    orders: CourierOrder[];
    pendingOrders: CourierOrder[];
    stats: CourierDashboardStats;
  }) => void
) => {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.map((docSnapshot, index) =>
      mapOrder(docSnapshot, index)
    );
    const pendingOrders = orders.filter((order) => order.status !== 'Entregado');

    onChange({
      orders,
      pendingOrders,
      stats: buildStats(orders),
    });
  });
};

export const markOrderAsDelivered = async (order: CourierOrder) => {
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  const deliveredAt = serverTimestamp();

  if (!order.paymentId) {
    await updateDoc(orderRef, {
      status: 'Entregado',
      deliveryStatus: 'Entregado',
      paymentStatus: 'Cobrado',
      paymentStatusLabel: 'Cobrado',
      deliveredAt,
      updatedAt: deliveredAt,
    });
    return;
  }

  const paymentRef = doc(db, PAYMENTS_COLLECTION, order.paymentId);
  const batch = writeBatch(db);

  batch.update(orderRef, {
    status: 'Entregado',
    deliveryStatus: 'Entregado',
    paymentStatus: 'Cobrado',
    paymentStatusLabel: 'Cobrado',
    deliveredAt,
    updatedAt: deliveredAt,
  });

  batch.update(paymentRef, {
    status: 'Cobrado',
    statusLabel: 'Cobrado',
    updatedAt: deliveredAt,
    collectedAt: deliveredAt,
  });

  await batch.commit();
};

// NUEVA FUNCIÓN: Registrar pago sin marcar como entregado
export const registerPayment = async (order: CourierOrder) => {
  // Validar que no esté ya pagado
  if (order.paymentStatus === 'Cobrado') {
    throw new Error('Este pedido ya fue cobrado');
  }

  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  const collectedAt = serverTimestamp();
  
  // Solo actualizar campos de pago, NO el status de entrega
  await updateDoc(orderRef, {
    paymentStatus: 'Cobrado',
    paymentStatusLabel: 'Cobrado',
    paymentCollectedAt: collectedAt,
    updatedAt: collectedAt,
  });
};

export const backfillCourierOrderCodes = async () => {
  const snapshot = await getDocs(
    query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'asc'))
  );

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnapshot, index) => {
    const data = docSnapshot.data();

    if (data.orderCode && data.deliveryZone) {
      return;
    }

    batch.update(docSnapshot.ref, {
      orderCode:
        data.orderCode ??
        `ORD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      deliveryZone: data.deliveryZone ?? 'Zona pendiente',
      deliveryStatus: data.deliveryStatus ?? 'Pendiente',
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};
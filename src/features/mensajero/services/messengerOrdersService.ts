import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getCurrentZone } from '../../location/utils/zoneLimits';
import type { MessengerOrder, MessengerOrderItem, MessengerShiftClosure, MessengerShiftOrderSnapshot,} from '../types';
import { getVisibleMessengerOrders } from '../utils/orderVisibility';
import { isMessengerOrderCollected, isSameLocalDay, } from '../utils/collectionSummary';
import {
  assertCanTransitionDeliveryStatus,
  getOrderDeliveryStatusForDeliveryStatus,
  getOrderStatusForDeliveryStatus,
} from '../utils/deliveryStatusFlow';

type DeliveryStatus = MessengerOrder['deliveryStatus'];
type OrderData = Record<string, unknown>;
type PaymentData = Record<string, unknown>;

type CustomerLocation = {
  label: string | null;
  lat: number | null;
  lng: number | null;
};

const normalizeDeliveryStatus = (status: unknown): DeliveryStatus => {
  if (status === 'accepted' || status === 'ACCEPTED') return 'accepted';
  if (status === 'pending_reassignment' || status === 'PENDING_REASSIGNMENT') {
    return 'pending_reassignment';
  }
  if (status === 'not_delivered' || status === 'NOT_DELIVERED') {
    return 'not_delivered';
  }
  if (status === 'reprogrammed') {
  return 'reprogrammed';
  }
  if (status === 'cancelled' || status === 'CANCELLED' || status === 'CANCELADO') {
    return 'cancelled';
  }
  if (status === 'in_transit' || status === 'delivered') return status;
  if (status === 'IN_TRANSIT') return 'in_transit';
  if (status === 'DELIVERED') return 'delivered';
  return 'assigned';
};

const normalizeOrderDeliveryStatus = (status: DeliveryStatus) => {
  if (status === 'accepted') return 'ACCEPTED';
  if (status === 'pending_reassignment') return 'PENDING_REASSIGNMENT';
  if (status === 'in_transit') return 'IN_TRANSIT';
  if (status === 'delivered') return 'DELIVERED';
  if (status === 'not_delivered') return 'NOT_DELIVERED';
  if (status === 'cancelled') return 'CANCELLED';
  if (status === 'reprogrammed') return 'REPROGRAMMED';
  return 'ASSIGNED';
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const readOrderItems = async (
  orderId: string
): Promise<MessengerOrderItem[]> => {
  const itemsSnapshot = await getDocs(
    collection(db, 'orders', orderId, 'orderItems')
  );

  return itemsSnapshot.docs.map((itemDoc) => {
    const item = itemDoc.data();

    return {
      id: itemDoc.id,
      name: String(item.productName || 'Producto sin nombre'),
      quantity: Number(item.quantity || 0),
      price: Number(item.unitPrice || 0),
    };
  });
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const toAmount = (...values: unknown[]) => {
  for (const value of values) {
    const amount =
      typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : null;

    if (amount != null && Number.isFinite(amount)) return amount;
  }

  return 0;
};

const readBuyerName = async (buyerId: unknown): Promise<string | null> => {
  const uid = asString(buyerId);
  if (!uid) return null;

  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;

  const user = userSnap.data();
  return asString(user.displayName) || asString(user.name) || asString(user.email);
};

const readCustomerLocation = async (
  locationId: unknown
): Promise<CustomerLocation> => {
  const id = asString(locationId);
  if (!id) return { label: null, lat: null, lng: null };

  const locationSnap = await getDoc(doc(db, 'locations', id));
  if (!locationSnap.exists()) return { label: null, lat: null, lng: null };

  const location = locationSnap.data();
  return {
    label: asString(location.label),
    lat: asNumber(location.lat),
    lng: asNumber(location.lng),
  };
};

const formatCourierZoneName = (zoneName: string | null): string | undefined => {
  const name = asString(zoneName)?.replace(/^Zona\s+\d+\s*-\s*/i, '');
  if (!name) return undefined;

  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
};

const formatOrderDisplayId = (value: unknown): string | undefined => {
  const code = asString(value);
  if (!code) return undefined;

  return code.startsWith('#') ? code : `#${code}`;
};

const readPayment = async (paymentId: string | null): Promise<PaymentData> => {
  if (!paymentId) return {};

  const paymentSnap = await getDoc(doc(db, 'payments', paymentId));
  return paymentSnap.exists() ? paymentSnap.data() : {};
};

const isCollectedPaymentStatus = (status: string) => {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  return normalized === 'cobrado' || normalized === 'pagado' || normalized === 'paid';
};

const mapMessengerOrder = async (
  deliveryId: string,
  delivery: OrderData
): Promise<MessengerOrder> => {
  const orderId = String(delivery.orderId || '');
  const orderSnap = orderId ? await getDoc(doc(db, 'orders', orderId)) : null;
  const order = orderSnap?.exists() ? orderSnap.data() : {};
  const paymentId = asString(order.paymentId) ?? (orderId || null);
  const [items, buyerName, customerLocation, payment] = await Promise.all([
    orderId ? readOrderItems(orderId) : [],
    readBuyerName(order.buyerId),
    readCustomerLocation(order.locationId),
    readPayment(paymentId),
  ]);
  const paymentStatus = String(payment.status ?? order.paymentStatus ?? 'PENDIENTE');
  const storedPaymentStatusLabel = String(
    payment.statusLabel ?? order.paymentStatusLabel ?? ''
  );
  const paymentCollectedAt =
    toDate(payment.collectedAt) ?? toDate(order.paymentCollectedAt);
  const customerName =
    asString(order.customerName) ||
    'Cliente no registrado';
  const address =
    asString(order.address) ||
    customerLocation.label ||
    'Direccion no registrada';
  const courierZoneName =
    customerLocation.lat != null && customerLocation.lng != null
      ? formatCourierZoneName(
          getCurrentZone(customerLocation.lat, customerLocation.lng)
        )
      : undefined;

  return {
    id: orderId || deliveryId,
    displayId: formatOrderDisplayId(delivery.orderCode),
    deliveryId,
    paymentId,
    customerName,
    buyerName: asString(order.customerName) || buyerName || 'Comprador invitado',
    secret: typeof order.secret === 'string' ? order.secret : undefined,
    phone: String(order.customerPhone || order.phone || 'Sin telefono'),
    address,
    city: String(order.deliveryZone || 'Cochabamba'),
    locationLabel: customerLocation.label ?? undefined,
    deliveryLat: customerLocation.lat,
    deliveryLng: customerLocation.lng,
    reference:
      asString(order.reference) ||
      asString(order.locationLabel) ||
      courierZoneName,
    items,
    cashToCollect: toAmount(delivery.amountCollected, payment.amount, order.total),
    paymentMethod: 'cash_on_delivery' as const,
    paymentStatus,
    paymentStatusLabel: isCollectedPaymentStatus(paymentStatus)
      ? 'Cobrado'
      : storedPaymentStatusLabel || 'Pendiente de cobro',
    paymentCollectedAt,
    collectedBy:
      asString(payment.collectedBy) ?? asString(order.collectedBy),
    deliveryMethod: String(order.deliveryMethod || 'Delivery'),
    deliveryStatus: normalizeDeliveryStatus(delivery.status),
    assignedAt: toDate(delivery.assignedAt),
    createdAt: toDate(delivery.createdAt) ?? toDate(order.createdAt),
    updatedAt: toDate(delivery.updatedAt) ?? toDate(order.updatedAt),
    reprogrammedAt: toDate(delivery.reprogrammedAt),
    newDeliveryAt: toDate(delivery.newDeliveryAt) ?? toDate(order.newDeliveryAt),
    reprogramReason:
      asString(delivery.reprogramReason) ||
      asString(order.reprogramReason) 
  };
};

export async function getMessengerOrders(
  courierId: string
): Promise<MessengerOrder[]> {
  const deliveriesQuery = query(
    collection(db, 'deliveries'),
    where('courierId', '==', courierId)
  );
  const deliveriesSnapshot = await getDocs(deliveriesQuery);

  const orders = await Promise.all(
    deliveriesSnapshot.docs.map((deliveryDoc) =>
      mapMessengerOrder(deliveryDoc.id, deliveryDoc.data())
    )
  );

  return getVisibleMessengerOrders(orders);
}

export async function getMessengerOrderById(
  courierId: string,
  orderId: string
): Promise<MessengerOrder | null> {
  const orders = await getMessengerOrders(courierId);
  return orders.find((order) => order.id === orderId) ?? null;
}

export function subscribeToMessengerOrders(
  courierId: string,
  onChange: (orders: MessengerOrder[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const deliveriesQuery = query(
    collection(db, 'deliveries'),
    where('courierId', '==', courierId)
  );

  return onSnapshot(
    deliveriesQuery,
    async (deliveriesSnapshot) => {
      try {
        const orders = await Promise.all(
          deliveriesSnapshot.docs.map((deliveryDoc) =>
            mapMessengerOrder(deliveryDoc.id, deliveryDoc.data())
          )
        );

        onChange(getVisibleMessengerOrders(orders));
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error
            : new Error('No se pudieron escuchar las entregas.')
        );
      }
    },
    (error) => {
      onError?.(error);
    }
  );
}

const getStatusForORder = (status: DeliveryStatus) => {
  switch (status) {
    case 'accepted':
      return 'ACEPTADO';
    case 'pending_reassignment':
      return 'PENDIENTE REASIGNACION';
    case 'in_transit':
      return 'EN CAMINO';
    case 'delivered':
      return 'ENTREGADO';
    case 'not_delivered':
      return 'NO ENTREGADO';
    case 'cancelled':
      return 'CANCELADO';
    case 'reprogrammed':
      return 'REPROGRAMADO';
    default:
      return 'ASIGNADO';
  }
};

export async function setMessengerOrderStatus(
  order: MessengerOrder,
  status: DeliveryStatus
) {
  assertCanTransitionDeliveryStatus(order.deliveryStatus, status);

  const deliveryRef = doc(db, 'deliveries', order.deliveryId);
  const dataToUpdate: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'in_transit') {
    dataToUpdate.inTransitAt = serverTimestamp();
  }

  if (status === 'delivered') {
    dataToUpdate.deliveredAt = serverTimestamp();
    dataToUpdate.customerConfirmed = true;
    dataToUpdate.customerConfirmedAt = serverTimestamp();
  }

  await updateDoc(deliveryRef, dataToUpdate);

  if (order.id) {
    await updateDoc(doc(db, 'orders', order.id), {
      status: getOrderStatusForDeliveryStatus(status),
      deliveryStatus: getOrderDeliveryStatusForDeliveryStatus(status),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function registerMessengerCashPayment(
  order: MessengerOrder,
  courierId: string
) {
  const orderRef = doc(db, 'orders', order.id);
  const deliveryRef = doc(db, 'deliveries', order.deliveryId);
  const paymentId = order.paymentId || order.id;
  const paymentRef = doc(db, 'payments', paymentId);
  const collectedAt = serverTimestamp();
  const batch = writeBatch(db);

  batch.update(orderRef, {
    paymentId,
    status: 'ENTREGADO',
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'COBRADO',
    paymentStatusLabel: 'Cobrado',
    paymentCollectedAt: collectedAt,
    collectedBy: courierId,
    deliveredAt: collectedAt,
    updatedAt: collectedAt,
  });

  batch.update(deliveryRef, {
    status: 'delivered',
    amountCollected: order.cashToCollect,
    collectedBy: courierId,
    paymentCollectedAt: collectedAt,
    customerConfirmed: true,
    customerConfirmedAt: collectedAt,
    deliveredAt: collectedAt,
    updatedAt: collectedAt,
  });

  batch.set(
    paymentRef,
    {
      paymentId,
      orderId: order.id,
      status: 'COBRADO',
      statusLabel: 'Cobrado',
      method: order.paymentMethod,
      amount: order.cashToCollect,
      collectedAt,
      collectedBy: courierId,
      updatedAt: collectedAt,
    },
    { merge: true }
  );

  await batch.commit();
}

export async function markMessengerOrderAsNotDelivered({
  order,
  reason,
  notes,
  courierId,
}: {
  order: MessengerOrder;
  reason: string;
  notes: string;
  courierId: string;
}) {
  const deliveryRef = doc(db, 'deliveries', order.deliveryId);
  const failedAt = serverTimestamp();

  await updateDoc(deliveryRef, {
    status: 'not_delivered',
    incidentType: 'delivery_problem',
    incidentReason: reason,
    incidentNotes: notes,
    incidentStatus: 'reported',
    reportedAt: failedAt,
    reportedBy: courierId,
    failedAt,
    customerConfirmed: false,
    updatedAt: failedAt,
  });

  if (order.id) {
    await updateDoc(doc(db, 'orders', order.id), {
      status: getOrderStatusForDeliveryStatus('not_delivered'),
      deliveryStatus: 'NOT_DELIVERED',
      updatedAt: serverTimestamp(),
    });
  }

  await setDoc(doc(db, 'undelivered_orders', order.id), {
    orderId: order.id,
    deliveryId: order.deliveryId,
    buyerName: order.buyerName || order.customerName,
    deliveryZone: order.city,
    deliveryMethod: order.deliveryMethod,
    address: order.address,
    incidentType: 'delivery_problem',
    incidentStatus: 'reported',
    reason,
    notes,
    reportedBy: courierId,
    reportedAt: serverTimestamp(),
    status: 'not_delivered',          
    total: order.cashToCollect,
    paymentMethod: 'Contra entrega', 
    createdAt: serverTimestamp(),
  });
}

export async function markMessengerOrderAsCancelledByNoPayment({
  order,
  notes,
  courierId,
}: {
  order: MessengerOrder;
  notes: string;
  courierId: string | null;
}) {
  const cancelledAt = serverTimestamp();
  const reason = 'Falta de pago del cliente';
  const batch = writeBatch(db);

  batch.update(doc(db, 'deliveries', order.deliveryId), {
    status: 'cancelled',
    cancellationReason: reason,
    cancellationNotes: notes,
    cancelledAt,
    cancelledBy: courierId,
    customerConfirmed: false,
    amountCollected: 0,
    updatedAt: cancelledAt,
  });

  if (order.id) {
    batch.update(doc(db, 'orders', order.id), {
      status: 'CANCELADO',
      deliveryStatus: 'CANCELLED',
      paymentStatus: 'CANCELADO',
      paymentStatusLabel: 'Cancelado por falta de pago',
      incidentReason: reason,
      incidentNotes: notes,
      cancelledAt,
      cancelledBy: courierId,
      updatedAt: cancelledAt,
    });
  }

  if (order.paymentId) {
    batch.set(
      doc(db, 'payments', order.paymentId),
      {
        status: 'CANCELADO',
        statusLabel: 'Cancelado por falta de pago',
        cancellationReason: reason,
        cancellationNotes: notes,
        cancelledAt,
        cancelledBy: courierId,
        updatedAt: cancelledAt,
      },
      { merge: true }
    );
  }

  batch.set(doc(db, 'cancelled_orders', order.id || order.deliveryId), {
    orderId: order.id,
    deliveryId: order.deliveryId,
    buyerName: order.buyerName || order.customerName,
    deliveryZone: order.city,
    deliveryMethod: order.deliveryMethod,
    address: order.address,
    reason,
    notes,
    status: 'cancelled',
    paymentStatus: 'CANCELADO',
    total: order.cashToCollect,
    paymentMethod: 'Contra entrega',
    cancelledBy: courierId,
    createdAt: cancelledAt,
    updatedAt: cancelledAt,
  });

  await batch.commit();
}
const SHIFT_CLOSURES_COLLECTION = 'messenger_shift_closures';

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getOrderActivityDate = (order: MessengerOrder) =>
  order.paymentCollectedAt ?? order.updatedAt ?? order.assignedAt ?? order.createdAt;

const isPendingForShift = (order: MessengerOrder) =>
  order.deliveryStatus === 'assigned' ||
  order.deliveryStatus === 'accepted' ||
  order.deliveryStatus === 'in_transit';

const buildShiftOrderSnapshot = (
  order: MessengerOrder
): MessengerShiftOrderSnapshot => ({
  id: order.id,
  deliveryId: order.deliveryId,
  customerName: order.customerName,
  buyerName: order.buyerName,
  phone: order.phone,
  address: order.address,
  city: order.city,
  deliveryStatus: order.deliveryStatus,
  paymentStatus: order.paymentStatus,
  paymentStatusLabel: order.paymentStatusLabel,
  cashToCollect: order.cashToCollect,
  paymentCollectedAt: order.paymentCollectedAt,
  assignedAt: order.assignedAt,
  updatedAt: order.updatedAt,
  items: order.items,
});

const buildShiftReportFromOrders = ({
  courierId,
  orders,
  date = new Date(),
}: {
  courierId: string;
  orders: MessengerOrder[];
  date?: Date;
}) => {
  const dateKey = getLocalDateKey(date);

  const completedOrders = orders.filter(
    (order) =>
      isMessengerOrderCollected(order) &&
      order.paymentCollectedAt != null &&
      isSameLocalDay(order.paymentCollectedAt, date)
  );

  const pendingOrders = orders.filter(isPendingForShift);

    const notDeliveredOrders = orders.filter(
    (order) => order.deliveryStatus === 'not_delivered'
  );

  const cancelledOrders = orders.filter(
    (order) => order.deliveryStatus === 'cancelled'
  );

  const incidentOrders = [...notDeliveredOrders, ...cancelledOrders];

  const relatedDates = [
    ...completedOrders,
    ...pendingOrders,
    ...incidentOrders,
  ]
    .map(getOrderActivityDate)
    .filter((value): value is Date => value != null)
    .sort((a, b) => a.getTime() - b.getTime());

  const startedAt = relatedDates[0] ?? null;
  const totalCollected = completedOrders.reduce(
    (total, order) => total + order.cashToCollect,
    0
  );

  return {
    courierId,
    dateKey,
    status: 'closed' as const,
    startedAt,
    summary: {
      completedCount: completedOrders.length,
      pendingCount: pendingOrders.length,
      notDeliveredCount: notDeliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      totalCollected,
    },
    completedOrders: completedOrders.map(buildShiftOrderSnapshot),
    pendingOrders: pendingOrders.map(buildShiftOrderSnapshot),
    incidentOrders: incidentOrders.map(buildShiftOrderSnapshot),
  };
};

const mapShiftOrderSnapshot = (
  value: unknown
): MessengerShiftOrderSnapshot => {
  const data = (value ?? {}) as Record<string, unknown>;

  const items = Array.isArray(data.items)
    ? data.items.map((item) => {
        const itemData = (item ?? {}) as Record<string, unknown>;

        return {
          id: String(itemData.id ?? ''),
          name: String(itemData.name ?? 'Producto sin nombre'),
          quantity: Number(itemData.quantity ?? 0),
          price: Number(itemData.price ?? 0),
        };
      })
    : [];

  return {
    id: String(data.id ?? ''),
    deliveryId: String(data.deliveryId ?? ''),
    customerName: String(data.customerName ?? 'Cliente no registrado'),
    buyerName: String(data.buyerName ?? 'Comprador invitado'),
    phone: String(data.phone ?? 'Sin telefono'),
    address: String(data.address ?? 'Direccion no registrada'),
    city: String(data.city ?? 'Cochabamba'),
    deliveryStatus: normalizeDeliveryStatus(data.deliveryStatus),
    paymentStatus: String(data.paymentStatus ?? 'PENDIENTE'),
    paymentStatusLabel: String(data.paymentStatusLabel ?? 'Pendiente de cobro'),
    cashToCollect: toAmount(data.cashToCollect),
    paymentCollectedAt: toDate(data.paymentCollectedAt),
    assignedAt: toDate(data.assignedAt),
    updatedAt: toDate(data.updatedAt),
    items,
  };
};

const mapShiftClosure = (
  reportId: string,
  data: Record<string, unknown>
): MessengerShiftClosure => {
  const summary = (data.summary ?? {}) as Record<string, unknown>;

  return {
    id: reportId,
    courierId: String(data.courierId ?? ''),
    dateKey: String(data.dateKey ?? ''),
    status: 'closed',
    startedAt: toDate(data.startedAt),
    closedAt: toDate(data.closedAt),
    createdAt: toDate(data.createdAt),
    summary: {
      completedCount: Number(summary.completedCount ?? 0),
      pendingCount: Number(summary.pendingCount ?? 0),
      notDeliveredCount: Number(summary.notDeliveredCount ?? 0),
      cancelledCount: Number(summary.cancelledCount ?? 0),
      totalCollected: toAmount(summary.totalCollected),
    },
    completedOrders: Array.isArray(data.completedOrders)
      ? data.completedOrders.map(mapShiftOrderSnapshot)
      : [],
    pendingOrders: Array.isArray(data.pendingOrders)
      ? data.pendingOrders.map(mapShiftOrderSnapshot)
      : [],
    incidentOrders: Array.isArray(data.incidentOrders)
      ? data.incidentOrders.map(mapShiftOrderSnapshot)
      : [],
  };
};

export async function closeMessengerShift({
  courierId,
  orders,
}: {
  courierId: string;
  orders: MessengerOrder[];
}): Promise<MessengerShiftClosure> {
  const now = new Date();
  const reportData = buildShiftReportFromOrders({
    courierId,
    orders,
    date: now,
  });

  const reportId = `${courierId}_${reportData.dateKey}`;
  const reportRef = doc(db, SHIFT_CLOSURES_COLLECTION, reportId);
  const existingReport = await getDoc(reportRef);

  if (existingReport.exists()) {
    throw new Error('La jornada de hoy ya fue cerrada.');
  }

  await setDoc(reportRef, {
    ...reportData,
    closedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return {
    id: reportId,
    ...reportData,
    closedAt: now,
    createdAt: now,
  };
}

export function subscribeToMessengerShiftClosures(
  courierId: string,
  onChange: (reports: MessengerShiftClosure[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const reportsQuery = query(
    collection(db, SHIFT_CLOSURES_COLLECTION),
    where('courierId', '==', courierId)
  );

  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs
        .map((reportDoc) => mapShiftClosure(reportDoc.id, reportDoc.data()))
        .sort((a, b) => {
          const dateA = a.closedAt ?? a.createdAt ?? new Date(0);
          const dateB = b.closedAt ?? b.createdAt ?? new Date(0);

          return dateB.getTime() - dateA.getTime();
        });

      onChange(reports);
    },
    (error) => {
      onError?.(error);
    }
  );
}

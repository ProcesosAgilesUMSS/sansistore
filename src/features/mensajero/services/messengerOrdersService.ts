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
import type { MessengerOrder, MessengerOrderItem } from '../types';

type DeliveryStatus = MessengerOrder['deliveryStatus'];

type OrderLocation = {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
};

const readOrderLocation = async (
  locationId: unknown
): Promise<OrderLocation | null> => {
  if (typeof locationId !== 'string' || !locationId) return null;

  const locationSnap = await getDoc(doc(db, 'locations', locationId));
  if (!locationSnap.exists()) return null;

  const location = locationSnap.data();
  const lat = Number(location.lat);
  const lng = Number(location.lng);

  return {
    id: locationSnap.id,
    label: String(location.label || 'Ubicacion sin referencia'),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
};

const normalizeDeliveryStatus = (status: unknown): DeliveryStatus => {
  if (status === 'accepted' || status === 'ACCEPTED') return 'accepted';
  if (status === 'pending_reassignment' || status === 'PENDING_REASSIGNMENT') {
    return 'pending_reassignment';
  }
  if (status === 'not_delivered' || status === 'NOT_DELIVERED') {
    return 'not_delivered';
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

export async function getMessengerOrders(
  courierId: string
): Promise<MessengerOrder[]> {
  const deliveriesQuery = query(
    collection(db, 'deliveries'),
    where('courierId', '==', courierId)
  );
  const deliveriesSnapshot = await getDocs(deliveriesQuery);

  const orders = await Promise.all(
    deliveriesSnapshot.docs.map(async (deliveryDoc) => {
      const delivery = deliveryDoc.data();
      const orderId = String(delivery.orderId || '');
      const orderSnap = orderId
        ? await getDoc(doc(db, 'orders', orderId))
        : null;
      const order = orderSnap?.exists() ? orderSnap.data() : {};
      const location = await readOrderLocation(order.locationId);
      const items = orderId ? await readOrderItems(orderId) : [];
      const paymentStatus = String(order.paymentStatus || 'PENDIENTE');

      return {
        id: orderId || deliveryDoc.id,
        deliveryId: deliveryDoc.id,
        paymentId: typeof order.paymentId === 'string' ? order.paymentId : null,
        orderCode: String(order.orderCode || order.code || orderId || ''),  
        customerName: String(order.customerName || 'Cliente no registrado'),
        buyerName: String(order.customerName || 'Comprador invitado'),       
        phone: String(order.customerPhone || 'Sin telefono'),
        address: String(
          order.address || location?.label || 'Direccion no registrada'
        ),
        city: String(order.deliveryZone || 'Cochabamba'),
        reference: location?.label,
        locationId: location?.id ?? null,
        locationLabel: location?.label ?? 'Ubicacion no registrada',
        deliveryLat: location?.lat ?? null,
        deliveryLng: location?.lng ?? null,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        items,
        cashToCollect: Number(delivery.amountCollected || order.total || 0),
        paymentMethod: 'cash_on_delivery' as const,
        paymentStatus,
        paymentStatusLabel:
          paymentStatus.toLowerCase() === 'cobrado' ||
          paymentStatus.toLowerCase() === 'pagado'
            ? 'Cobrado'
            : 'Pendiente de cobro',
        paymentCollectedAt: order.paymentCollectedAt?.toDate?.() ?? null,
        collectedBy: typeof order.collectedBy === 'string' ? order.collectedBy : null,
        deliveryMethod: String(order.deliveryMethod || 'Delivery'),         
        deliveryStatus: normalizeDeliveryStatus(delivery.status),
        assignedAt: toDate(delivery.assignedAt),
        createdAt: toDate(delivery.createdAt) ?? toDate(order.createdAt),
        updatedAt: toDate(delivery.updatedAt) ?? toDate(order.updatedAt),
      };
    })
  );

  return orders.sort((a, b) => a.id.localeCompare(b.id));
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
          deliveriesSnapshot.docs.map(async (deliveryDoc) => {
            const delivery = deliveryDoc.data();
            const orderId = String(delivery.orderId || '');
            const orderSnap = orderId
              ? await getDoc(doc(db, 'orders', orderId))
              : null;
            const order = orderSnap?.exists() ? orderSnap.data() : {};
            const location = await readOrderLocation(order.locationId);
            const items = orderId ? await readOrderItems(orderId) : [];
            const paymentStatus = String(order.paymentStatus || 'PENDIENTE');

            return {
              id: orderId || deliveryDoc.id,
              deliveryId: deliveryDoc.id,
              paymentId:
                typeof order.paymentId === 'string' ? order.paymentId : null,
              orderCode: String(order.orderCode || order.code || orderId || ''),
              customerName: String(
                order.customerName || 'Cliente no registrado'
              ),
              buyerName: String(order.customerName || 'Comprador invitado'),
              phone: String(order.customerPhone || 'Sin telefono'),
              address: String(
                order.address || location?.label || 'Direccion no registrada'
              ),
              city: String(order.deliveryZone || 'Cochabamba'),
              reference: location?.label,
              locationId: location?.id ?? null,
              locationLabel: location?.label ?? 'Ubicacion no registrada',
              deliveryLat: location?.lat ?? null,
              deliveryLng: location?.lng ?? null,
              lat: location?.lat ?? null,
              lng: location?.lng ?? null,
              items,
              cashToCollect: Number(delivery.amountCollected || order.total || 0),
              paymentMethod: 'cash_on_delivery' as const,
              paymentStatus,
              paymentStatusLabel:
                paymentStatus.toLowerCase() === 'cobrado' ||
                paymentStatus.toLowerCase() === 'pagado'
                  ? 'Cobrado'
                  : 'Pendiente de cobro',
              paymentCollectedAt:
                order.paymentCollectedAt?.toDate?.() ?? null,
              collectedBy:
                typeof order.collectedBy === 'string'
                  ? order.collectedBy
                  : null,
              deliveryMethod: String(order.deliveryMethod || 'Delivery'),
              deliveryStatus: normalizeDeliveryStatus(delivery.status),
              assignedAt: toDate(delivery.assignedAt),
              createdAt: toDate(delivery.createdAt) ?? toDate(order.createdAt),
              updatedAt: toDate(delivery.updatedAt) ?? toDate(order.updatedAt),
            };
          })
        );

        onChange(orders.sort((a, b) => a.id.localeCompare(b.id)));
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
    default:
      return 'ASIGNADO';
  }
};

export async function setMessengerOrderStatus(
  order: MessengerOrder,
  status: DeliveryStatus
) {
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
      status: getStatusForORder(status),
      deliveryStatus: normalizeOrderDeliveryStatus(status),
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
  const collectedAt = serverTimestamp();
  const batch = writeBatch(db);

  batch.update(orderRef, {
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
    customerConfirmed: true,
    customerConfirmedAt: collectedAt,
    deliveredAt: collectedAt,
    updatedAt: collectedAt,
  });

  if (order.paymentId) {
    batch.update(doc(db, 'payments', order.paymentId), {
      status: 'COBRADO',
      statusLabel: 'Cobrado',
      amount: order.cashToCollect,
      collectedAt,
      collectedBy: courierId,
      updatedAt: collectedAt,
    });
  }

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
      deliveryStatus: 'NOT_DELIVERED',
      updatedAt: serverTimestamp(),
    });
  }

  //Este es para los no entregados
  await setDoc(doc(db, 'undelivered_orders', order.id), {
    orderId: order.id,
    orderCode: order.orderCode,
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
    orderCode: order.orderCode,
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

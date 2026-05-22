import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { MessengerOrder, MessengerOrderItem } from '../types';

type DeliveryStatus = MessengerOrder['deliveryStatus'];

const normalizeDeliveryStatus = (status: unknown): DeliveryStatus => {
  if (status === 'accepted' || status === 'ACCEPTED') return 'accepted';
  if (status === 'pending_reassignment' || status === 'PENDING_REASSIGNMENT') {
    return 'pending_reassignment';
  }
  if (status === 'not_delivered' || status === 'NOT_DELIVERED') {
    return 'not_delivered';
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
  return 'ASSIGNED';
};

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
      const items = orderId ? await readOrderItems(orderId) : [];

      const locationId = String(order.locationId || '');
      let lat: number | null = null;
      let lng: number | null = null;
      if (locationId) {
        const locationSnap = await getDoc(doc(db, 'locations', locationId));
        if (locationSnap.exists()) {
          const locationData = locationSnap.data();
          lat = typeof locationData.lat === 'number' ? locationData.lat : null;
          lng = typeof locationData.lng === 'number' ? locationData.lng : null;
        }
      }

      return {
        id: orderId || deliveryDoc.id,
        deliveryId: deliveryDoc.id,
        customerName: String(order.customerName || 'Cliente no registrado'),
        phone: String(order.customerPhone || 'Sin telefono'),
        address: String(order.address || 'Direccion no registrada'),
        city: 'Cochabamba',
        lat,
        lng,
        items,
        cashToCollect: Number(delivery.amountCollected || order.total || 0),
        paymentMethod: 'cash_on_delivery' as const,
        deliveryStatus: normalizeDeliveryStatus(delivery.status),
      };
    })
  );

  return orders.sort((a, b) => a.id.localeCompare(b.id));
}

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
      deliveryStatus: normalizeOrderDeliveryStatus(status),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function markMessengerOrderAsNotDelivered({
  order,
  reason,
  notes,
}: {
  order: MessengerOrder;
  reason: string;
  notes: string;
}) {
  const deliveryRef = doc(db, 'deliveries', order.deliveryId);
  const failedAt = serverTimestamp();

  await updateDoc(deliveryRef, {
    status: 'not_delivered',
    incidentReason: reason,
    incidentNotes: notes,
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

  await addDoc(collection(db, 'undelivered_orders'), {
    orderId: order.id,
    deliveryId: order.deliveryId,
    customerName: order.customerName,
    deliveryZone: order.city,
    address: order.address,
    reason,
    notes,
    status: 'not_delivered',
    total: order.cashToCollect,
    paymentMethod: order.paymentMethod,
    createdAt: serverTimestamp(),
  });
}

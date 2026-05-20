import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
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

      return {
        id: orderId || deliveryDoc.id,
        deliveryId: deliveryDoc.id,
        orderCode: String(order.orderCode || order.code || orderId || ''),  
        customerName: String(order.customerName || 'Cliente no registrado'),
        buyerName: String(order.customerName || 'Comprador invitado'),       
        phone: String(order.customerPhone || 'Sin telefono'),
        address: String(order.address || 'Direccion no registrada'),
        city: String(order.deliveryZone || 'Cochabamba'),
        items,
        cashToCollect: Number(delivery.amountCollected || order.total || 0),
        paymentMethod: 'cash_on_delivery' as const,
        deliveryMethod: String(order.deliveryMethod || 'Delivery'),         
        deliveryStatus: normalizeDeliveryStatus(delivery.status),
      };
    })
  );

  return orders.sort((a, b) => a.id.localeCompare(b.id));
}

const getStatusForORder = (status: DeliveryStatus) => {
  switch (status) {
    case 'accepted': return 'ACEPTADO';
    case 'pending_reassignment': return 'PENDIENTE REASIGNACION';
    case 'in_transit': return 'EN CAMINO';
    case 'delivered': return 'ENTREGADO';
    case 'not_delivered': return 'CANCELADO';
  }
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
      status: getStatusForORder(status),
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

  //Este es para los no entregados
  await setDoc(doc(db, 'undelivered_orders', order.id), {
    orderId: order.id,
    orderCode: order.orderCode,
    deliveryId: order.deliveryId,
    buyerName: order.buyerName || order.customerName,
    deliveryZone: order.city,
    deliveryMethod: order.deliveryMethod,
    address: order.address,
    reason,
    notes,
    status: 'not_delivered',          
    total: order.cashToCollect,
    paymentMethod: 'Contra entrega', 
    createdAt: serverTimestamp(),
  });
}


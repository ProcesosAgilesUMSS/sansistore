import {
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
  if (status === 'in_transit' || status === 'delivered') return status;
  return 'assigned';
};

const readOrderItems = async (orderId: string): Promise<MessengerOrderItem[]> => {
  const itemsSnapshot = await getDocs(collection(db, 'orders', orderId, 'orderItems'));

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

export async function getMessengerOrders(courierId: string): Promise<MessengerOrder[]> {
  const deliveriesQuery = query(
    collection(db, 'deliveries'),
    where('courierId', '==', courierId),
  );
  const deliveriesSnapshot = await getDocs(deliveriesQuery);

  const orders = await Promise.all(
    deliveriesSnapshot.docs.map(async (deliveryDoc) => {
      const delivery = deliveryDoc.data();
      const orderId = String(delivery.orderId || '');
      const orderSnap = orderId ? await getDoc(doc(db, 'orders', orderId)) : null;
      const order = orderSnap?.exists() ? orderSnap.data() : {};
      const items = orderId ? await readOrderItems(orderId) : [];

      return {
        id: orderId || deliveryDoc.id,
        deliveryId: deliveryDoc.id,
        customerName: String(order.customerName || 'Cliente no registrado'),
        phone: String(order.customerPhone || 'Sin telefono'),
        address: String(order.address || 'Direccion no registrada'),
        city: 'Cochabamba',
        items,
        cashToCollect: Number(delivery.amountCollected || order.total || 0),
        paymentMethod: 'cash_on_delivery',
        deliveryStatus: normalizeDeliveryStatus(delivery.status),
      };
    }),
  );

  return orders.sort((a, b) => a.id.localeCompare(b.id));
}

export async function setMessengerOrderStatus(
  order: MessengerOrder,
  status: DeliveryStatus,
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
      deliveryStatus: status,
      updatedAt: serverTimestamp(),
    });
  }
}

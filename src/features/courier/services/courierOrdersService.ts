import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export type CourierOrder = {
  deliveryId: string;
  orderId: string;
  courierId: string;
  status: string;
  deliveryCode: string;
  amountCollected: number;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  orderTotal: number;
};

type DeliveryStatus = 'assigned' | 'in_transit' | 'delivered';

export async function getCourierOrders(courierId: string): Promise<CourierOrder[]> {
  const deliveriesRef = collection(db, 'deliveries');
  const deliveriesQuery = query(deliveriesRef, where('courierId', '==', courierId));
  const deliveriesSnapshot = await getDocs(deliveriesQuery);

  const orders = await Promise.all(
    deliveriesSnapshot.docs.map(async (deliveryDoc) => {
      const deliveryData = deliveryDoc.data();

      const orderId = String(deliveryData.orderId || '');
      const paymentId = String(deliveryData.paymentId || '');

      let orderData: Record<string, any> = {};
      let paymentData: Record<string, any> = {};

      if (orderId) {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          orderData = orderSnap.data();
        }
      }

      const finalPaymentId = paymentId || String(orderData.paymentId || '');

      if (finalPaymentId) {
        const paymentRef = doc(db, 'payments', finalPaymentId);
        const paymentSnap = await getDoc(paymentRef);

        if (paymentSnap.exists()) {
          paymentData = paymentSnap.data();
        }
      }

      return {
        deliveryId: deliveryDoc.id,
        orderId,
        courierId: String(deliveryData.courierId || ''),
        status: String(deliveryData.status || 'assigned'),
        deliveryCode: String(deliveryData.deliveryCode || ''),
        amountCollected: Number(
          deliveryData.amountCollected || paymentData.amount || orderData.total || 0,
        ),
        customerName: String(orderData.customerName || 'Cliente no registrado'),
        customerPhone: String(orderData.customerPhone || 'Sin teléfono'),
        address: String(orderData.address || 'Dirección no registrada'),
        paymentMethod: String(
          paymentData.method || orderData.paymentMethod || 'cash_on_delivery',
        ),
        paymentStatus: String(paymentData.status || orderData.paymentStatus || 'pending'),
        orderTotal: Number(orderData.total || deliveryData.amountCollected || 0),
      };
    }),
  );

  return orders;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
) {
  const deliveryRef = doc(db, 'deliveries', deliveryId);

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
  }

  await updateDoc(deliveryRef, dataToUpdate);
}
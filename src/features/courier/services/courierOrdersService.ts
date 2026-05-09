import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export type DeliveryStatus =
  | 'assigned'
  | 'accepted'
  | 'pending_reassignment'
  | 'in_transit'
  | 'delivered';

export type CourierOrder = {
  deliveryId: string;
  orderId: string;
  courierId: string;
  status: DeliveryStatus;
  deliveryCode: string;
  amountCollected: number;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  orderTotal: number;
  assignedAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  inTransitAt: Date | null;
  deliveredAt: Date | null;
};

function mapTimestamp(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return null;
}

function normalizeStatus(value: unknown): DeliveryStatus {
  if (value === 'accepted' || value === 'ACCEPTED') return 'accepted';
  if (value === 'pending_reassignment' || value === 'PENDING_REASSIGNMENT') {
    return 'pending_reassignment';
  }
  if (value === 'in_transit' || value === 'IN_TRANSIT') return 'in_transit';
  if (value === 'delivered' || value === 'DELIVERED') return 'delivered';
  return 'assigned';
}

function normalizeOrderDeliveryStatus(status: DeliveryStatus) {
  if (status === 'accepted') return 'ACCEPTED';
  if (status === 'pending_reassignment') return 'PENDING_REASSIGNMENT';
  if (status === 'in_transit') return 'IN_TRANSIT';
  if (status === 'delivered') return 'DELIVERED';
  return 'ASSIGNED';
}

function canTransition(currentStatus: DeliveryStatus, nextStatus: DeliveryStatus) {
  if (nextStatus === 'accepted' || nextStatus === 'pending_reassignment') {
    return currentStatus === 'assigned';
  }

  if (nextStatus === 'in_transit') {
    return currentStatus === 'accepted';
  }

  if (nextStatus === 'delivered') {
    return currentStatus === 'accepted' || currentStatus === 'in_transit';
  }

  return false;
}

export async function getCourierOrders(courierId: string): Promise<CourierOrder[]> {
  const deliveriesRef = collection(db, 'deliveries');
  const deliveriesQuery = query(deliveriesRef, where('courierId', '==', courierId));
  const deliveriesSnapshot = await getDocs(deliveriesQuery);

  const orders = await Promise.all(
    deliveriesSnapshot.docs.map(async (deliveryDoc) => {
      const deliveryData = deliveryDoc.data();

      const orderId = String(deliveryData.orderId || '');
      const paymentId = String(deliveryData.paymentId || '');

      let orderData: Record<string, unknown> = {};
      let paymentData: Record<string, unknown> = {};
      let userData: Record<string, unknown> = {};
      let locationData: Record<string, unknown> = {};

      if (orderId) {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          orderData = orderSnap.data() as Record<string, unknown>;
        }
      }

      const buyerId = String(orderData.buyerId || deliveryData.buyerId || '');
      const locationId = String(
        orderData.locationId || deliveryData.locationId || deliveryData.deliveryLocationId || '',
      );

      if (buyerId) {
        const buyerRef = doc(db, 'users', buyerId);
        const buyerSnap = await getDoc(buyerRef);

        if (buyerSnap.exists()) {
          userData = buyerSnap.data() as Record<string, unknown>;
        }
      }

      if (locationId) {
        const locationRef = doc(db, 'locations', locationId);
        const locationSnap = await getDoc(locationRef);

        if (locationSnap.exists()) {
          locationData = locationSnap.data() as Record<string, unknown>;
        }
      }

      const finalPaymentId = paymentId || String(orderData.paymentId || '');

      if (finalPaymentId) {
        const paymentRef = doc(db, 'payments', finalPaymentId);
        const paymentSnap = await getDoc(paymentRef);

        if (paymentSnap.exists()) {
          paymentData = paymentSnap.data() as Record<string, unknown>;
        }
      }

      return {
        deliveryId: deliveryDoc.id,
        orderId,
        courierId: String(deliveryData.courierId || ''),
        status: normalizeStatus(deliveryData.status),
        deliveryCode: String(deliveryData.deliveryCode || ''),
        amountCollected: Number(
          deliveryData.amountCollected || paymentData.amount || orderData.total || 0,
        ),
        customerName: String(
          orderData.customerName || userData.displayName || 'Cliente no registrado',
        ),
        customerPhone: String(
          orderData.customerPhone || userData.phoneNumber || 'Sin telefono',
        ),
        address: String(
          orderData.address || locationData.label || 'Direccion no registrada',
        ),
        paymentMethod: String(
          paymentData.method || orderData.paymentMethod || 'cash_on_delivery',
        ),
        paymentStatus: String(paymentData.status || orderData.paymentStatus || 'pending'),
        orderTotal: Number(orderData.total || deliveryData.amountCollected || 0),
        assignedAt: mapTimestamp(deliveryData.assignedAt),
        acceptedAt: mapTimestamp(deliveryData.acceptedAt),
        rejectedAt: mapTimestamp(deliveryData.rejectedAt),
        inTransitAt: mapTimestamp(deliveryData.inTransitAt),
        deliveredAt: mapTimestamp(deliveryData.deliveredAt),
      };
    }),
  );

  return orders;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  courierId: string,
) {
  const deliveryRef = doc(db, 'deliveries', deliveryId);

  await runTransaction(db, async (transaction) => {
    const deliverySnap = await transaction.get(deliveryRef);

    if (!deliverySnap.exists()) {
      throw new Error('La entrega ya no existe.');
    }

    const deliveryData = deliverySnap.data() as Record<string, unknown>;
    const currentStatus = normalizeStatus(deliveryData.status);

    if (String(deliveryData.courierId || '') !== courierId) {
      throw new Error('No puedes modificar una entrega asignada a otro mensajero.');
    }

    if (!canTransition(currentStatus, status)) {
      throw new Error(`No puedes pasar de ${currentStatus} a ${status}.`);
    }

    const deliveryUpdate: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'accepted') {
      deliveryUpdate.acceptedAt = serverTimestamp();
    }

    if (status === 'pending_reassignment') {
      deliveryUpdate.rejectedAt = serverTimestamp();
    }

    if (status === 'in_transit') {
      deliveryUpdate.inTransitAt = serverTimestamp();
    }

    if (status === 'delivered') {
      deliveryUpdate.deliveredAt = serverTimestamp();
      deliveryUpdate.customerConfirmed = true;
    }

    transaction.update(deliveryRef, deliveryUpdate);

    const orderId = String(deliveryData.orderId || '');

    if (orderId) {
      const orderRef = doc(db, 'orders', orderId);
      transaction.set(
        orderRef,
        {
          deliveryStatus: normalizeOrderDeliveryStatus(status),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
}

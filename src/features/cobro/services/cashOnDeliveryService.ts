import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type {
  CashOnDeliveryOrderInput,
  CashOnDeliveryOrderResult,
} from '../types';

const ORDERS_COLLECTION = 'orders';
const PAYMENTS_COLLECTION = 'payments';
const DELIVERIES_COLLECTION = 'deliveries';

export const createCashOnDeliveryOrder = async (
  order: CashOnDeliveryOrderInput
): Promise<CashOnDeliveryOrderResult> => {
  if (order.items.length === 0 || order.total <= 0) {
    throw new Error('Order must contain at least one valid item.');
  }

  const orderRef = doc(collection(db, ORDERS_COLLECTION));
  const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
  const deliveryRef = doc(collection(db, DELIVERIES_COLLECTION));
  const user = auth.currentUser;
  const createdAt = serverTimestamp();
  const buyerName =
    order.customerName || user?.displayName || 'Comprador invitado';
  const customerPhone = order.customerPhone || user?.phoneNumber || '';
  const address = order.address || '';

  const batch = writeBatch(db);

  batch.set(orderRef, {
    buyerId: user?.uid ?? null,
    buyerName,
    customerName: buyerName,
    customerPhone,
    address,
    items: order.items,
    productsTotal: order.productsTotal,
    additionalCharges: order.additionalCharges,
    total: order.total,
    status: 'Registrado',
    paymentMethod: 'Pago contra entrega',
    paymentStatus: 'Pendiente',
    paymentStatusLabel: 'Pendiente de cobro',
    paymentId: paymentRef.id,
    deliveryId: deliveryRef.id,
    createdAt,
    updatedAt: createdAt,
  });

  batch.set(paymentRef, {
    orderId: orderRef.id,
    buyerId: user?.uid ?? null,
    amount: order.total,
    method: 'Pago contra entrega',
    status: 'Pendiente',
    statusLabel: 'Pendiente de cobro',
    createdAt,
    updatedAt: createdAt,
  });

  batch.set(deliveryRef, {
    orderId: orderRef.id,
    paymentId: paymentRef.id,
    courierId: order.courierId || null,
    status: 'assigned',
    deliveryCode: `DEL-${orderRef.id.slice(0, 8).toUpperCase()}`,
    amountCollected: order.total,
    customerConfirmed: false,
    createdAt,
    updatedAt: createdAt,
  });

  await batch.commit();

  return {
    orderId: orderRef.id,
    paymentId: paymentRef.id,
    deliveryId: deliveryRef.id,
  };
};

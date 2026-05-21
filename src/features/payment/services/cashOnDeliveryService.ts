import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
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
const LOCATIONS_COLLECTION = 'locations';
const USERS_COLLECTION = 'users';

async function getDefaultDeliveryLocation(userId?: string) {
  if (!userId) {
    return {
      locationId: null,
      address: 'Direccion no registrada',
    };
  }

  const snapshot = await getDocs(
    query(collection(db, LOCATIONS_COLLECTION), where('userId', '==', userId))
  );
  const defaultLocation =
    snapshot.docs.find((locationDoc) => locationDoc.data().isDefault === true) ??
    snapshot.docs[0];

  if (!defaultLocation) {
    return {
      locationId: null,
      address: 'Direccion no registrada',
    };
  }

  return {
    locationId: defaultLocation.id,
    address: String(defaultLocation.data().label ?? 'Direccion no registrada'),
  };
}

async function getAvailableSellerId() {
  const snapshot = await getDocs(
    query(
      collection(db, USERS_COLLECTION),
      where('roles', 'array-contains', 'vendedor'),
      limit(1)
    )
  );

  return snapshot.empty ? null : snapshot.docs[0].id;
}

export const createCashOnDeliveryOrder = async (
  order: CashOnDeliveryOrderInput
): Promise<CashOnDeliveryOrderResult> => {
  if (order.items.length === 0 || order.total <= 0) {
    throw new Error('Order must contain at least one valid item.');
  }

  const user = auth.currentUser;
  const orderRef = doc(collection(db, ORDERS_COLLECTION));
  const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
  const deliveryRef = doc(collection(db, DELIVERIES_COLLECTION));
  const batch = writeBatch(db);
  const createdAt = serverTimestamp();
  const orderCode = `ORD-${orderRef.id.slice(0, 8).toUpperCase()}`;
  const customerName =
    order.customerName || user?.displayName || user?.email || 'Comprador';
  const customerPhone = order.customerPhone || user?.phoneNumber || '';
  const deliveryLocation = await getDefaultDeliveryLocation(user?.uid);
  const sellerId = await getAvailableSellerId();
  const deliveryAddress = order.address || deliveryLocation.address;
  const paymentMethod = 'cash_on_delivery';
  const paymentMethodLabel = 'Pago contra entrega';
  const status = 'CREADO';
  const statusLabel = 'Pedido registrado';

  batch.set(orderRef, {
    orderId: orderRef.id,
    orderCode,
    buyerId: user?.uid ?? null,
    sellerId,
    buyerName: customerName,
    customerName,
    customerPhone,
    address: deliveryAddress,
    items: order.items,
    productsTotal: order.productsTotal,
    additionalCharges: order.additionalCharges,
    total: order.total,
    status,
    incidentReason: null,
    locationId: deliveryLocation.locationId,
    paymentMethod,
    paymentStatus: 'PENDIENTE',
    paymentStatusLabel: 'Pendiente de cobro',
    paymentId: paymentRef.id,
    deliveryId: deliveryRef.id,
    deliveryStatus: 'created',
    confirmedAt: null,
    cancelledAt: null,
    createdAt,
    updatedAt: createdAt,
  });

  order.items.forEach((item, index) => {
    const itemId = `${orderRef.id}-item-${index + 1}`;
    batch.set(doc(collection(orderRef, 'orderItems'), itemId), {
      itemId,
      productId: item.productId,
      productName: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    });
  });

  batch.set(paymentRef, {
    paymentId: paymentRef.id,
    orderId: orderRef.id,
    buyerId: user?.uid ?? null,
    amount: order.total,
    method: paymentMethod,
    status: 'PENDIENTE',
    statusLabel: 'Pendiente de cobro',
    registeredBy: user?.uid ?? null,
    verifiedBy: null,
    registeredAt: createdAt,
    verifiedAt: null,
    updatedAt: createdAt,
  });

  batch.set(deliveryRef, {
    deliveryId: deliveryRef.id,
    orderId: orderRef.id,
    paymentId: paymentRef.id,
    courierId: order.courierId || null,
    status: 'created',
    deliveryCode: `DEL-${orderRef.id.slice(0, 8).toUpperCase()}`,
    attemptNumber: 1,
    incidentReason: null,
    evidenceUrl: null,
    failureReason: null,
    amountCollected: order.total,
    customerConfirmed: false,
    customerConfirmedAt: null,
    assignedAt: null,
    pickedUpAt: null,
    inTransitAt: null,
    deliveredAt: null,
    failedAt: null,
    reprogrammedAt: null,
    createdAt,
    updatedAt: createdAt,
  });

  await batch.commit();

  return {
    orderId: orderRef.id,
    paymentId: paymentRef.id,
    deliveryId: deliveryRef.id,
    orderCode,
    items: order.items,
    productsTotal: order.productsTotal,
    additionalCharges: order.additionalCharges,
    total: order.total,
    paymentMethod,
    paymentMethodLabel,
    deliveryAddress,
    status,
    statusLabel,
  };
};

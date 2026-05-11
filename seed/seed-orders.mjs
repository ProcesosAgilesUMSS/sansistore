import admin from 'firebase-admin';
import {
  seedDeliveries,
  seedLocations,
  seedOrders,
  seedUsers,
} from './seed-orders-data.mjs';

const PAYMENT_COLLECTION = 'payments';

const statusForDashboard = (deliveryStatus) => {
  if (deliveryStatus === 'delivered') return 'Entregado';
  if (deliveryStatus === 'pending_reassignment') return 'No entregado';
  return 'Pendiente';
};

const paymentStatusForDashboard = (deliveryStatus) => {
  if (deliveryStatus === 'delivered') return 'Cobrado';
  return 'Pendiente';
};

const paymentLabelForDashboard = (deliveryStatus) => {
  if (deliveryStatus === 'delivered') return 'Cobrado';
  return 'Pendiente de cobro';
};

const toTimestamp = (value, fallback = null) => {
  if (!value) return fallback;
  return admin.firestore.Timestamp.fromDate(new Date(value));
};

const normalizeItems = (items) =>
  items.map((item) => ({
    itemId: item.itemId,
    productId: item.productId,
    productName: item.productName,
    name: item.productName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

async function deleteCollection(firestore, collectionName) {
  const snapshot = await firestore.collection(collectionName).get();

  for (const docSnapshot of snapshot.docs) {
    if (collectionName === 'orders') {
      const subSnapshot = await docSnapshot.ref.collection('orderItems').get();
      const subBatch = firestore.batch();

      subSnapshot.docs.forEach((subDoc) => subBatch.delete(subDoc.ref));
      await subBatch.commit();
    }
  }

  const batch = firestore.batch();
  snapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
  await batch.commit();
}

export async function run({ db }) {
  const firestore = db;
  const now = admin.firestore.FieldValue.serverTimestamp();

  await deleteCollection(firestore, 'orders');
  await deleteCollection(firestore, 'deliveries');
  await deleteCollection(firestore, 'locations');
  await deleteCollection(firestore, PAYMENT_COLLECTION);

  for (const user of seedUsers) {
    await firestore.collection('users').doc(user.uid).set({
      ...user,
      updatedAt: now,
      createdAt: now,
    });
  }

  for (const location of seedLocations) {
    await firestore.collection('locations').doc(location.locationId).set({
      ...location,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const order of seedOrders) {
    const items = normalizeItems(order.items);
    const productsTotal = items.reduce((total, item) => total + item.subtotal, 0);
    const additionalCharges = Number((order.total - productsTotal).toFixed(2));
    const deliveryStatus = order.deliveryStatus ?? 'created';
    const paymentId = `payment-${order.orderId}`;
    const createdAt = toTimestamp(order.createdAt, now);
    const updatedAt = toTimestamp(order.updatedAt, now);
    const deliveredAt =
      deliveryStatus === 'delivered'
        ? toTimestamp(order.updatedAt, admin.firestore.FieldValue.serverTimestamp())
        : null;

    await firestore.collection('orders').doc(order.orderId).set({
      ...order,
      orderCode: order.orderId.replace('order-', 'ORD-2026-'),
      buyerName: order.customerName,
      deliveryZone: order.address,
      productsTotal,
      additionalCharges: Math.max(additionalCharges, 0),
      status: statusForDashboard(deliveryStatus),
      paymentStatus: paymentStatusForDashboard(deliveryStatus),
      paymentStatusLabel: paymentLabelForDashboard(deliveryStatus),
      paymentMethod: 'Contra entrega',
      deliveryMethod: 'Delivery',
      specialInstructions: order.incidentReason || 'Ninguna',
      paymentId,
      items,
      createdAt,
      updatedAt,
      deliveredAt,
    });

    const orderRef = firestore.collection('orders').doc(order.orderId);
    for (const item of items) {
      await orderRef.collection('orderItems').doc(item.itemId).set(item);
    }

    await firestore.collection(PAYMENT_COLLECTION).doc(paymentId).set({
      paymentId,
      orderId: order.orderId,
      buyerId: order.buyerId,
      amount: order.total,
      method: 'cash_on_delivery',
      status: paymentStatusForDashboard(deliveryStatus),
      statusLabel: paymentLabelForDashboard(deliveryStatus),
      createdAt,
      updatedAt,
      collectedAt: deliveredAt,
    });
  }

  for (const delivery of seedDeliveries) {
    await firestore.collection('deliveries').doc(delivery.deliveryId).set({
      ...delivery,
      assignedAt: toTimestamp(delivery.assignedAt),
      acceptedAt: toTimestamp(delivery.acceptedAt),
      rejectedAt: toTimestamp(delivery.rejectedAt),
      pickedUpAt: toTimestamp(delivery.pickedUpAt),
      inTransitAt: toTimestamp(delivery.inTransitAt),
      deliveredAt:
        delivery.status === 'delivered'
          ? admin.firestore.FieldValue.serverTimestamp()
          : toTimestamp(delivery.deliveredAt),
      failedAt: toTimestamp(delivery.failedAt),
      reprogrammedAt: toTimestamp(delivery.reprogrammedAt),
      createdAt: toTimestamp(delivery.createdAt, now),
      updatedAt: toTimestamp(delivery.updatedAt, now),
    });
  }

  console.log(
    `Seeded courier test data: ${seedOrders.length} orders, ${seedDeliveries.length} deliveries, ${seedUsers.length} users.`
  );
}

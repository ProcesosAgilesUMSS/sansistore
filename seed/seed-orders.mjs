// ─────────────────────────────────────────────────────────────────────────────
// seed-orders.mjs
// Seeder para la HU: "Como Vendedor, quiero marcar pedidos como listos para entrega"
//
// Crea las colecciones:
//   users → locations → orders (+ orderItems subcollección) → deliveries
//
// Prerequisito: seed-products.mjs debe haberse ejecutado primero
//   ya que orderItems referencian productIds existentes.
//
// Uso:
//   node seed/index.mjs seed-orders          ← solo este seeder
//   node seed/index.mjs                      ← todos los seeders en orden
// ─────────────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin';
import { seedUsers, seedLocations, seedOrders, seedDeliveries } from './seed-orders-data.mjs';

export async function run({ adminApp, db }) {
  const firestore = db;

  // ── 1. USUARIOS ────────────────────────────────────────────────────────────
  console.log('\nSeeding users...');
  for (const u of seedUsers) {
    const docRef = firestore.collection('users').doc(u.uid);
    await docRef.set({
      email: u.email,
      displayName: u.displayName,
      roles: u.roles,
      institutionalId: u.institutionalId,
      isActive: u.isActive,
      createdBy: u.createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  Upserted user [${u.roles.join(',')}]`, u.uid, '-', u.displayName);
  }

  // ── 2. UBICACIONES ─────────────────────────────────────────────────────────
  console.log('\nSeeding locations...');
  for (const l of seedLocations) {
    const docRef = firestore.collection('locations').doc(l.locationId);
    await docRef.set({
      userId: l.userId,
      label: l.label,
      type: l.type,
      lat: l.lat,
      lng: l.lng,
      isDefault: l.isDefault,
    });
    console.log(`  Upserted location "${l.label}" for user`, l.userId);
  }

  // ── 3. ÓRDENES + orderItems (subcollección) ────────────────────────────────
  console.log('\nSeeding orders & orderItems...');
  for (const o of seedOrders) {
    const { items, ...orderData } = o;

    const orderRef = firestore.collection('orders').doc(o.orderId);
    await orderRef.set({
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      status: orderData.status,
      total: orderData.total,
      locationId: orderData.locationId,
      paymentStatus: orderData.paymentStatus,
      deliveryStatus: orderData.deliveryStatus,
      deliveryId: orderData.deliveryId,
      paymentId: orderData.paymentId,
      incidentReason: orderData.incidentReason,
      confirmedAt: orderData.confirmedAt
        ? admin.firestore.Timestamp.fromDate(new Date(orderData.confirmedAt))
        : null,
      cancelledAt: orderData.cancelledAt
        ? admin.firestore.Timestamp.fromDate(new Date(orderData.cancelledAt))
        : null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(orderData.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(orderData.updatedAt)),
    });
    console.log(`  Upserted order [${orderData.status}]`, o.orderId);

    // orderItems como subcollección de orders
    for (const item of items) {
      const itemRef = orderRef.collection('orderItems').doc(item.itemId);
      await itemRef.set({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
      console.log(`    Upserted orderItem`, item.itemId, '-', item.productName);
    }
  }

  // ── 4. DELIVERIES ──────────────────────────────────────────────────────────
  // Solo para pedidos que ya pasaron por LISTO o ASIGNADO.
  // Los pedidos en RESERVADO NO tienen delivery aún:
  //   se crea en el momento en que el vendedor ejecuta "marcar como LISTO".
  console.log('\nSeeding deliveries...');
  for (const d of seedDeliveries) {
    const docRef = firestore.collection('deliveries').doc(d.deliveryId);
    await docRef.set({
      orderId: d.orderId,
      courierId: d.courierId,
      status: d.status,
      deliveryCode: d.deliveryCode,
      attemptNumber: d.attemptNumber,
      incidentReason: d.incidentReason,
      evidenceUrl: d.evidenceUrl,
      failureReason: d.failureReason,
      amountCollected: d.amountCollected,
      customerConfirmed: d.customerConfirmed,
      customerConfirmedAt: d.customerConfirmedAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.customerConfirmedAt))
        : null,
      assignedAt: d.assignedAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.assignedAt))
        : null,
      pickedUpAt: d.pickedUpAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.pickedUpAt))
        : null,
      inTransitAt: d.inTransitAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.inTransitAt))
        : null,
      deliveredAt: d.deliveredAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.deliveredAt))
        : null,
      failedAt: d.failedAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.failedAt))
        : null,
      reprogrammedAt: d.reprogrammedAt
        ? admin.firestore.Timestamp.fromDate(new Date(d.reprogrammedAt))
        : null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(d.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(d.updatedAt)),
    });
    console.log(`  Upserted delivery [${d.status}]`, d.deliveryId, '→ order', d.orderId);
  }

  console.log('\nseed-orders complete ✓');
}

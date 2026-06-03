#!/usr/bin/env node
import admin from 'firebase-admin';
import { userList } from './data/users.mjs';
import { categoryList } from './data/categories.mjs';
import { productList } from './data/products.mjs';
import { locationList } from './data/locations.mjs';
import { orderList } from './data/orders.mjs';
import { deliveryList } from './data/deliveries.mjs';
import { run as seedCartItems } from './data/cart.mjs';

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

admin.initializeApp({
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || 'sansistore',
});
const db = admin.firestore();
const auth = admin.auth();

const TS = () => admin.firestore.FieldValue.serverTimestamp();

const FAILED_RESTORE_ORDER_IDS = new Set([
  '019e74a6-1001-7000-bbbb-000000000001_restore-chromium',
  '019e74a6-1002-7000-bbbb-000000000002_restore-firefox',
  '019e74a6-1003-7000-bbbb-000000000003_restore-webkit',
]);

const toTimestamp = (value, fallback = TS()) => {
  if (!value) return fallback;
  return admin.firestore.Timestamp.fromDate(new Date(value));
};

const setDoc = async (collection, id, data) => {
  const ref = id
    ? db.collection(collection).doc(id)
    : db.collection(collection).doc();
  await ref.set(data, { merge: true });
  return ref.id;
};

const clearCollection = async (collectionPath) => {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

const buildOrderItems = (order) =>
  order.items.map((item, idx) => {
    const unitPrice = item.product.hasOffer
      ? item.product.offerPrice
      : item.product.price;
    const subtotal = unitPrice * item.quantity;
    return {
      itemId: `${order.id}-item-${idx + 1}`,
      productId: item.product.slug,
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });

const calculateOrderTotal = (order) =>
  buildOrderItems(order).reduce((sum, item) => sum + item.subtotal, 0);

async function seedAuthUsers() {
  for (const user of userList) {
    try {
      const existing = await auth.getUser(user.uid);
      const hasGoogle = existing.providerData.some(
        (p) => p.providerId === 'google.com'
      );

      if (user.authType === 'google' && !hasGoogle) {
        await auth.deleteUser(user.uid);
      } else {
        continue;
      }
    } catch {
      try {
        if (user.authType === 'google') {
          const result = await auth.importUsers([
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL || '',
              emailVerified: true,
              providerData: [
                {
                  providerId: 'google.com',
                  uid: user.email,
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL || '',
                },
              ],
            },
          ]);

          if (result.failureCount > 0) {
            throw result.errors[0].error;
          }

          await auth.updateUser(user.uid, { password: '12345678' });
        } else {
          await auth.createUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL || '',
            emailVerified: false,
            password: '12345678',
          });
        }
      } catch (err) {
        console.log(`  ⚠ Auth: ${user.email} - ${err.message}`);
      }
    }
  }
  console.log('auth seeded');
}

async function seedFirestoreUsers() {
  for (const user of userList) {
    await setDoc('users', user.uid, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      roles: user.roles,
      institutionalId: user.institutionalId,
      isActive: user.isActive,
      createdBy: 'seeder',
      createdAt: TS(),
      updatedAt: TS(),
    });
  }
  console.log('users seeded');
}

async function seedCategories() {
  for (const cat of categoryList) {
    await setDoc('categories', cat.id, {
      categoryId: cat.id,
      name: cat.name,
      active: cat.active,
      createdBy: 'seeder',
      createdAt: TS(),
    });
  }
  console.log('categories seeded');
}

async function seedProducts() {
  for (const p of productList) {
    const productId = await setDoc('products', p.slug, {
      productId: p.slug,
      categoryId: p.category.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      active: p.active !== false,
      hasOffer: p.hasOffer || false,
      offerPrice: p.offerPrice || null,
      badge: p.badge || null,
      sourceUrl: p.sourceUrl,
      createdBy: 'seeder',
      createdAt: TS(),
      soldCount: p.soldCount || 0,
    });

    const inventoryEnabled =
      p.inventoryEnabled !== undefined
        ? p.inventoryEnabled
        : p.stockAvailable > 0;

    await setDoc('inventory', productId, {
      productId,
      stockTotal: p.stockTotal,
      stockAvailable: p.stockAvailable,
      stockReserved: 0,
      minStock: 5,
      enabled: inventoryEnabled,
      updatedAt: TS(),
    });

    for (let i = 0; i < p.reviews.length; i++) {
      const review = p.reviews[i];
      await setDoc('reviews', `${p.slug}-review-${i + 1}`, {
        productId,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        active: true,
        createdBy: 'seeder',
        createdAt: toTimestamp('2026-04-20T10:00:00.000Z'),
      });
    }
  }
  console.log('products seeded');
}

async function seedLocations() {
  for (const loc of locationList) {
    await setDoc('locations', loc.id, {
      locationId: loc.id,
      userId: loc.user.uid,
      label: loc.label,
      type: loc.type,
      lat: loc.lat,
      lng: loc.lng,
      isDefault: loc.isDefault,
      createdAt: TS(),
      updatedAt: TS(),
    });
  }
  console.log('locations seeded');
}

async function seedOrders() {
  for (const order of orderList) {
    await clearCollection(`orders/${order.id}/orderItems`);

    const items = buildOrderItems(order);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryStatus = order.deliveryStatus;

    const paymentStatusMap = {
      created: 'PENDIENTE',
      assigned: 'PENDIENTE',
      accepted: 'PENDIENTE',
      in_transit: 'PENDIENTE',
      delivered: 'COBRADO',
      pending_reassignment: 'PENDIENTE',
      NOT_DELIVERED: 'PENDIENTE',
      CANCELLED: 'CANCELADO',
    };

    const isCancelled = order.status === 'CANCELADO';
    const delivery = deliveryList.find((item) => item.orderCode === order.id);

    await setDoc('orders', order.id, {
      orderId: order.id,
      secret: order.secret,
      buyerId: order.buyer.uid,
      sellerId: order.seller?.uid || null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.location?.label ?? null,
      status: order.status,
      incidentReason: order.incidentReason ?? null,
      failedAt: order.failedAt ? toTimestamp(order.failedAt) : null,
      stockRestored: false,
      total,
      locationId: order.location.id,
      paymentStatus: paymentStatusMap[deliveryStatus] || 'PENDIENTE',
      deliveryStatus,
      deliveryId: delivery?.code ?? null,
      paymentId: order.id,
      confirmedAt: toTimestamp(order.confirmedAt),
      cancelledAt:
        isCancelled && order.failedAt ? toTimestamp(order.failedAt) : null,
      createdAt: toTimestamp(order.createdAt),
      updatedAt: toTimestamp(order.updatedAt),
    });

    for (const item of items) {
      await setDoc(`orders/${order.id}/orderItems`, item.itemId, item);
    }

    if (FAILED_RESTORE_ORDER_IDS.has(order.id)) {
      for (const item of items) {
        await setDoc('inventory', item.productId, {
          stockReserved: admin.firestore.FieldValue.increment(item.quantity),
          updatedAt: TS(),
        });
      }
    }

    await setDoc('payments', order.id, {
      paymentId: order.id,
      orderId: order.id,
      amount: total,
      method: 'cash_on_delivery',
      status: paymentStatusMap[deliveryStatus] || 'PENDIENTE',
      registeredBy: order.buyer.uid,
      verifiedBy: null,
      registeredAt: toTimestamp(order.createdAt),
      verifiedAt: null,
      updatedAt: toTimestamp(order.updatedAt),
    });
  }
  console.log('orders seeded');
}

async function seedDeliveries() {
  for (const d of deliveryList) {
    const legacyIndex = /^order-(\d+)$/.exec(d.orderCode)?.[1];
    const order = legacyIndex
      ? orderList[Number(legacyIndex) - 1]
      : orderList.find((item) => item.id === d.orderCode);

    await setDoc('deliveries', d.code, {
      deliveryId: d.code,
      orderId: order?.id || d.orderCode,
      orderCode: d.orderCode,
      courierId: d.courier ? d.courier.uid : null,
      status: d.status,
      deliveryCode: d.code.replace('delivery-', 'DEL-2026-'),
      attemptNumber: d.attemptNumber,
      incidentReason: d.incidentReason ?? null,
      incidentNotes: d.incidentNotes ?? null,
      cancellationReason: d.cancellationReason ?? null,
      cancellationNotes: d.cancellationNotes ?? null,
      evidenceUrl: null,
      failureReason: null,
      amountCollected: order ? calculateOrderTotal(order) : null,
      customerConfirmed: d.customerConfirmed,
      customerConfirmedAt: toTimestamp(d.customerConfirmedAt),
      assignedAt: toTimestamp(d.assignedAt),
      pickedUpAt: toTimestamp(d.pickedUpAt),
      inTransitAt: toTimestamp(d.inTransitAt),
      deliveredAt: toTimestamp(d.deliveredAt),
      failedAt: toTimestamp(d.failedAt),
      cancelledAt: toTimestamp(d.cancelledAt),
      reprogrammedAt: toTimestamp(d.reprogrammedAt),
      createdAt: toTimestamp(d.createdAt),
      updatedAt: toTimestamp(d.updatedAt),
    });
  }
  console.log('deliveries seeded');
}

async function main() {
  try {
    await seedAuthUsers();
    await seedFirestoreUsers();
    await seedCategories();
    await seedProducts();
    await seedCartItems({ db });
    await seedLocations();
    await seedOrders();
    await seedDeliveries();
  } catch (err) {
    console.error('seed failed:', err);
    process.exit(1);
  }
}

main();

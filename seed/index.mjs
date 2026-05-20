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
  process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

admin.initializeApp({
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || 'sansistore',
});
const db = admin.firestore();
const auth = admin.auth();

const TS = () => admin.firestore.FieldValue.serverTimestamp();

const toTimestamp = (value, fallback = TS()) => {
  if (!value) return fallback;
  return admin.firestore.Timestamp.fromDate(new Date(value));
};

const setDoc = async (collection, id, data) => {
  const ref = id
    ? db.collection(collection).doc(id)
    : db.collection(collection).doc();
  await ref.set(data, { merge: true });
  console.log(`  ✓ ${collection}/${ref.id}`);
  return ref.id;
};

async function seedAuthUsers() {
  console.log('\n Seeding Auth users...');
  for (const user of userList) {
    try {
      const existing = await auth.getUser(user.uid);
      const hasGoogle = existing.providerData.some(
        (p) => p.providerId === 'google.com'
      );

      if (user.authType === 'google' && !hasGoogle) {
        await auth.deleteUser(user.uid);
      } else {
        console.log(`  ✓ Auth: ${user.email} (exists)`);
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
        } else {
          await auth.createUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL || '',
            emailVerified: false,
            password: 'password123',
          });
        }
        console.log(`  ✓ Auth: ${user.email} (${user.authType})`);
      } catch (err) {
        console.log(`  ⚠ Auth: ${user.email} - ${err.message}`);
      }
    }
  }
}

async function seedFirestoreUsers() {
  console.log('\n Seeding Firestore users...');
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
}

async function seedCategories() {
  console.log('\n Seeding categories...');
  for (const cat of categoryList) {
    await setDoc('categories', cat.id, {
      categoryId: cat.id,
      name: cat.name,
      active: cat.active,
      createdBy: 'seeder',
      createdAt: TS(),
    });
  }
}

async function seedProducts() {
  console.log('\n Seeding products, inventory & reviews...');
  for (const p of productList) {
    const productId = await setDoc('products', p.slug, {
      productId: p.slug,
      categoryId: p.category.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      active: true,
      hasOffer: p.hasOffer || false,
      offerPrice: p.offerPrice || null,
      badge: p.badge || null,
      sourceUrl: p.sourceUrl,
      createdBy: 'seeder',
      createdAt: TS(),
    });

    await setDoc('inventory', productId, {
      productId,
      stockTotal: p.stockTotal,
      stockAvailable: p.stockAvailable,
      stockReserved: 0,
      minStock: 5,
      enabled: p.stockAvailable > 0,
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
}

async function seedLocations() {
  console.log('\n Seeding locations...');
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
}

async function seedOrders() {
  console.log('\n Seeding orders & orderItems...');
  for (const order of orderList) {
    const items = order.items.map((item, idx) => {
      const unitPrice = item.product.hasOffer
        ? item.product.offerPrice
        : item.product.price;
      const subtotal = unitPrice * item.quantity;
      return {
        itemId: `${order.code}-item-${idx + 1}`,
        productId: item.product.slug,
        productName: item.product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryStatus = order.deliveryStatus;

    const paymentStatusMap = {
      created: 'PENDIENTE',
      assigned: 'PENDIENTE',
      accepted: 'PENDIENTE',
      in_transit: 'PENDIENTE',
      delivered: 'COBRADO',
      pending_reassignment: 'PENDIENTE',
    };

    const deliveryCode = order.code.replace('order', 'delivery');
    const paymentCode = order.code.replace('order', 'payment');

    await setDoc('orders', order.code, {
      orderId: order.code,
      buyerId: order.buyer.uid,
      sellerId: order.seller.uid,
      status: order.status,
      incidentReason: null,
      total,
      locationId: order.location.id,
      paymentStatus: paymentStatusMap[deliveryStatus] || 'PENDIENTE',
      deliveryStatus,
      deliveryId: deliveryStatus !== 'created' ? deliveryCode : null,
      paymentId: paymentCode,
      confirmedAt: toTimestamp(order.confirmedAt),
      cancelledAt: null,
      createdAt: toTimestamp(order.createdAt),
      updatedAt: toTimestamp(order.updatedAt),
    });

    for (const item of items) {
      await setDoc(`orders/${order.code}/orderItems`, item.itemId, item);
    }

    await setDoc('payments', paymentCode, {
      paymentId: paymentCode,
      orderId: order.code,
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
}

async function seedDeliveries() {
  console.log('\n Seeding deliveries...');
  for (const d of deliveryList) {
    await setDoc('deliveries', d.code, {
      deliveryId: d.code,
      orderId: d.orderCode,
      courierId: d.courier ? d.courier.uid : null,
      status: d.status,
      deliveryCode: d.code.replace('delivery-', 'DEL-2026-'),
      attemptNumber: d.attemptNumber,
      incidentReason: null,
      evidenceUrl: null,
      failureReason: null,
      amountCollected: d.amountCollected,
      customerConfirmed: d.customerConfirmed,
      customerConfirmedAt: toTimestamp(d.customerConfirmedAt),
      assignedAt: toTimestamp(d.assignedAt),
      pickedUpAt: toTimestamp(d.pickedUpAt),
      inTransitAt: toTimestamp(d.inTransitAt),
      deliveredAt: toTimestamp(d.deliveredAt),
      failedAt: toTimestamp(d.failedAt),
      reprogrammedAt: toTimestamp(d.reprogrammedAt),
      createdAt: toTimestamp(d.createdAt),
      updatedAt: toTimestamp(d.updatedAt),
    });
  }
}

async function main() {
  console.log(' Starting seed...\n');

  await seedAuthUsers();
  await seedFirestoreUsers();
  await seedCategories();
  await seedProducts();
  await seedCartItems({ db });
  await seedLocations();
  await seedOrders();
  await seedDeliveries();

  console.log('\n Seed complete!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error(' Seed failed:', err);
  process.exit(1);
});

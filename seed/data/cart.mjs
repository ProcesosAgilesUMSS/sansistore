import admin from 'firebase-admin';
import { Users } from './users.mjs';
import { Products } from './products.mjs';

const cartItemsData = [
  {
    user: Users.ANA,
    items: [
      {
        cartItemId: 'cart-user-ana-1',
        producto: Products.LECHE_PIL,
        quantity: 2,
      },
      {
        cartItemId: 'cart-user-ana-2',
        producto: Products.GALLETAS_VICTORIA,
        quantity: 1,
      },
    ],
  },
  {
    user: Users.CARLOS,
    items: [
      {
        cartItemId: 'cart-user-carlos-1',
        producto: Products.ARROZ_CAISY,
        quantity: 3,
      },
    ],
  },
  {
    user: Users.MARIA,
    items: [
      {
        cartItemId: 'cart-user-maria-1',
        producto: Products.GALLETAS_VICTORIA,
        quantity: 4,
      },
      {
        cartItemId: 'cart-user-maria-2',
        producto: Products.ACEITE_FINO,
        quantity: 1,
      },
    ],
  },
  {
    user: Users.JUAN,
    items: [
      {
        cartItemId: 'cart-user-juan-1',
        producto: Products.YOGURT_TEST_SIN_RESENAS,
        quantity: 1,
      },
    ],
  },
];

export async function run({ db }) {
  const firestore = db;

  console.log('Clearing existing cartItems subcollections for seeded users...');
  for (const entry of cartItemsData) {
    const snap = await firestore
      .collection('users')
      .doc(entry.user.uid)
      .collection('cartItems')
      .get();

    if (!snap.empty) {
      const batch = firestore.batch();
      for (const doc of snap.docs) batch.delete(doc.ref);
      await batch.commit();
    }
  }

  console.log(`Seeding cartItems for ${cartItemsData.length} users...`);

  for (const entry of cartItemsData) {
    for (const item of entry.items) {
      await firestore
        .collection('users')
        .doc(entry.user.uid)
        .collection('cartItems')
        .doc(item.cartItemId)
        .set({
          cartItemId: item.cartItemId,
          userId: entry.user.uid,
          productId: item.producto.slug,
          quantity: item.quantity,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`  ✓ users/${entry.user.uid}/cartItems/${item.cartItemId}`);
    }
  }

  console.log('Cart items seeded successfully.');
}

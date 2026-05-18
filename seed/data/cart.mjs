import admin from 'firebase-admin';
import users from './users.mjs';
import products from './products.mjs';

const cartItemsData = [
  {
    user: user.ANA,
    items: [
      {
        cartItemId: 'cart-user-ana-1',
        producto: products.LECHE_PIL_NATURAL_900_ML,
        quantity: 2,
      },
      {
        cartItemId: 'cart-user-ana-2',
        producto: products.GALLETAS_AGUA_VICTORIA_120_GR,
        quantity: 1,
      },
    ],
  },
  {
    user: user.CARLOS,
    items: [
      {
        cartItemId: 'cart-user-carlos-1',
        producto: products.ARROZ_GRANO_DE_ORO_CAISY_1_KG,
        quantity: 3,
      },
    ],
  },
  {
    user: user.MARIA,
    items: [
      {
        cartItemId: 'cart-user-maria-1',
        producto: products.GALLETAS_AGUA_VICTORIA_120_GR,
        quantity: 4,
      },
      {
        cartItemId: 'cart-user-maria-2',
        producto: products.ACEITE_FINO_VEGETAL_900_ML,
        quantity: 1,
      },
    ],
  },
  {
    user: user.JUAN,
    items: [
      {
        cartItemId: 'cart-user-juan-1',
        producto: products.YOGURT_TEST_SIN_RESENAS,
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

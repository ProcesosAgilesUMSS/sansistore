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
      {
        cartItemId: 'cart-user-ana-3',
        producto: Products.LECHE_DESCONTINUADA,
        quantity: 1,
      },
      {
        cartItemId: 'cart-user-ana-4',
        producto: Products.CHOCOLATE_SIN_STOCK,
        quantity: 2,
      },
      {
        cartItemId: 'cart-user-ana-5',
        producto: Products.AZUCAR_DESHABILITADO,
        quantity: 3,
      },
      {
        cartItemId: 'cart-user-ana-6',
        producto: Products.REFRESCO_PRECIO_SUBIO,
        quantity: 2,
        priceAtAdd: 12,
      },
      {
        cartItemId: 'cart-user-ana-7',
        producto: Products.PAN_PRECIO_BAJO,
        quantity: 1,
        priceAtAdd: 15,
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
        producto: Products.LECHE_PIL,
        quantity: 2,
      },
      {
        cartItemId: 'cart-user-juan-2',
        producto: Products.GALLETAS_VICTORIA,
        quantity: 1,
      },
      {
        cartItemId: 'cart-user-juan-3',
        producto: Products.LECHE_DESCONTINUADA,
        quantity: 1,
      },
      {
        cartItemId: 'cart-user-juan-4',
        producto: Products.CHOCOLATE_SIN_STOCK,
        quantity: 2,
      },
      {
        cartItemId: 'cart-user-juan-5',
        producto: Products.AZUCAR_DESHABILITADO,
        quantity: 3,
      },
      {
        cartItemId: 'cart-user-juan-6',
        producto: Products.REFRESCO_PRECIO_SUBIO,
        quantity: 2,
        priceAtAdd: 12,
      },
      {
        cartItemId: 'cart-user-juan-7',
        producto: Products.PAN_PRECIO_BAJO,
        quantity: 1,
        priceAtAdd: 15,
      },
    ],
  },
];

export async function run({ db }) {
  const firestore = db;

  for (const user of Object.values(Users)) {
    const snap = await firestore
      .collection('users')
      .doc(user.uid)
      .collection('cartItems')
      .get();

    if (!snap.empty) {
      const batch = firestore.batch();
      for (const doc of snap.docs) batch.delete(doc.ref);
      await batch.commit();
    }
  }

  for (const entry of cartItemsData) {
    for (const item of entry.items) {
      const payload = {
        cartItemId: item.cartItemId,
        userId: entry.user.uid,
        productId: item.producto.slug,
        quantity: item.quantity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (typeof item.priceAtAdd === 'number') {
        payload.priceAtAdd = item.priceAtAdd;
      }

      await firestore
        .collection('users')
        .doc(entry.user.uid)
        .collection('cartItems')
        .doc(item.cartItemId)
        .set(payload);
    }
  }

  console.log('Cart items seeded');
}

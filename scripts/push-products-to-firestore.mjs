import { initializeApp } from 'firebase/app';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { categories, catalogProducts } from '../seed/catalog-data.mjs';

const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value && key !== 'measurementId') {
    throw new Error(`Missing Firebase env var for ${key}`);
  }
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log(`Syncing ${categories.length} categories and ${catalogProducts.length} products to Firestore project ${firebaseConfig.projectId}...`);

  for (const category of categories) {
    await setDoc(doc(db, 'categories', category.id), {
      name: category.name,
      active: category.active,
      createdBy: 'direct-seed',
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('Upserted category', category.id);
  }

  for (const product of catalogProducts) {
    if (!product.legacyId) continue;

    await deleteDoc(doc(db, 'products', product.legacyId)).catch(() => {});
    await deleteDoc(doc(db, 'inventory', product.legacyId)).catch(() => {});
    console.log('Removed legacy product IDs for', product.legacyId);
  }

  for (const product of catalogProducts) {
    await setDoc(doc(db, 'products', product.id), {
      categoryId: product.category,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      active: true,
      hasOffer: product.hasOffer ?? false,
      offerPrice: product.offerPrice ?? null,
      badge: product.badge ?? null,
      sourceUrl: product.sourceUrl,
      createdBy: 'direct-seed',
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('Upserted product', product.id);

    await setDoc(doc(db, 'inventory', product.id), {
      productId: product.id,
      stockTotal: 100,
      stockAvailable: 100,
      stockReserved: 0,
      minStock: 5,
      enabled: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('Upserted inventory', product.id);

    const existingReviewsSnap = await getDocs(
      query(collection(db, 'reviews'), where('productId', '==', product.id))
    );

    await Promise.all(existingReviewsSnap.docs.map((reviewDoc) => deleteDoc(reviewDoc.ref)));
    console.log('Cleared reviews for', product.id);

    for (const review of product.reviews) {
      await setDoc(doc(db, 'reviews', review.id), {
        productId: product.id,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        active: true,
        createdBy: 'direct-seed',
        createdAt: review.createdAt
          ? Timestamp.fromDate(new Date(review.createdAt))
          : serverTimestamp(),
      }, { merge: true });
      console.log('Upserted review', review.id);
    }
  }

  console.log('Direct Firestore sync complete');
}

main().catch((error) => {
  console.error('Direct Firestore sync failed');
  console.error(error);
  process.exit(1);
});

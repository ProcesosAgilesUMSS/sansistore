import admin from 'firebase-admin';
import { categories, catalogProducts } from './catalog-data.mjs';

// Export a run function so the dispatcher can call it.
export async function run({ adminApp, db }) {
  const firestore = db;

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  console.log('Seeding categories...');
  const categoryMap = {};  // Store mapping of category ID to Firestore document ID
  for (const c of categories) {
    const docRef = firestore.collection('categories').doc(c.id);
    await docRef.set({
      name: c.name,
      active: c.active,
      createdBy: 'seeder',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    categoryMap[c.id] = docRef.id;  // Store the mapping
    console.log('Upserted category', docRef.id);
  }

  console.log('Seeding products, inventory & reviews...');
  for (const p of catalogProducts) {
    const stockTotal = rand(20, 500);
    const docRef = firestore.collection('products').doc(p.id);
    await docRef.set({
      categoryId: categoryMap[p.category],  // Reference the Firestore-assigned category document ID
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      active: true,
      hasOffer: p.hasOffer ?? false,
      offerPrice: p.offerPrice ?? null,
      badge: p.badge ?? null,
      sourceUrl: p.sourceUrl,
      createdBy: 'seeder',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const productId = docRef.id;
    console.log('Upserted product', productId);

    const invRef = firestore.collection('inventory').doc(productId);
    await invRef.set({
      productId,  // Reference the Firestore-assigned product document ID
      stockTotal,
      stockAvailable: stockTotal,
      stockReserved: 0,
      minStock: 5,
      enabled: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Upserted inventory for', productId, 'with ID', invRef.id);

    for (const review of p.reviews) {
      const reviewRef = firestore.collection('reviews').doc(review.id);
      await reviewRef.set({
        productId,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        active: true,
        createdBy: 'seeder',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Upserted review', review.id, 'for', productId);
    }
  }

  console.log('seed-products complete');
}

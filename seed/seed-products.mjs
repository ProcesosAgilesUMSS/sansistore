import admin from 'firebase-admin';

// Export a run function so the dispatcher can call it.
export async function run({ adminApp, db }) {
  const firestore = db;

  const categories = [
    { id: 'bebidas', name: 'Bebidas', active: true },
    { id: 'snacks', name: 'Snacks', active: true },
    { id: 'hogar', name: 'Hogar', active: true },
  ];

  function slugify(s) {
    return s
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]+/g, '')
      .replace(/--+/g, '-');
  }

  function imageForSlug(slug) {
    return `https://picsum.photos/seed/${encodeURIComponent(slug)}/600/400`;
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  console.log('Seeding categories...');
  const categoryMap = {};  // Store mapping of category ID to Firestore document ID
  for (const c of categories) {
    // Add document with auto-generated ID
    const docRef = await firestore.collection('categories').add({
      name: c.name,
      active: c.active,
      createdBy: 'seeder',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    categoryMap[c.id] = docRef.id;  // Store the mapping
    console.log('Upserted category', docRef.id);
  }

  const sampleProducts = [
    { name: 'Agua con gas', category: 'bebidas' },
    { name: 'Jugo de naranja', category: 'bebidas' },
    { name: 'Refresco de cola', category: 'bebidas' },
    { name: 'Papas fritas', category: 'snacks' },
    { name: 'Barra de chocolate', category: 'snacks' },
    { name: 'Mezcla de frutos secos', category: 'snacks' },
    { name: 'Jabón para platos', category: 'hogar' },
    { name: 'Detergente para ropa', category: 'hogar' },
    { name: 'Papel toalla', category: 'hogar' },
  ];

  console.log('Seeding products & inventory...');
  for (const p of sampleProducts) {
    const slug = slugify(p.name);
    const price = parseFloat((rand(100, 2000) / 100).toFixed(2));
    const hasOffer = Math.random() < 0.3;
    const offerPrice = hasOffer ? parseFloat((price * (0.7 + Math.random() * 0.25)).toFixed(2)) : null;

    // Add document with auto-generated ID
    const docRef = await firestore.collection('products').add({
      categoryId: categoryMap[p.category],  // Reference the Firestore-assigned category document ID
      name: p.name,
      price,
      imageUrl: imageForSlug(slug),
      active: true,
      hasOffer,
      offerPrice,
      createdBy: 'seeder',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const productId = docRef.id;
    console.log('Upserted product', productId);

    const stockTotal = rand(20, 500);
    // Add inventory document with auto-generated ID, reference product by its Firestore ID
    const invRef = await firestore.collection('inventory').add({
      productId: docRef.id,  // Reference the Firestore-assigned product document ID
      stockTotal,
      stockAvailable: stockTotal,
      stockReserved: 0,
      minStock: 5,
      enabled: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Upserted inventory for', productId, 'with ID', invRef.id);
  }

  console.log('seed-products complete');
}

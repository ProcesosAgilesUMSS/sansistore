import admin from 'firebase-admin';

const SELLER_ID = 'dev-admin';

const pendingOrdersData = [
  {
    orderId: 'PEND-001',
    buyerId: 'user-buyer-1',
    locationId: 'loc-001',
    items: [
      { productId: 'prod-001', productName: 'Cuaderno universitario 100h', unitPrice: 15.0, quantity: 2 },
      { productId: 'prod-002', productName: 'Bolígrafo azul punta fina', unitPrice: 5.0, quantity: 3 },
    ],
  },
  {
    orderId: 'PEND-002',
    buyerId: 'user-buyer-2',
    locationId: 'loc-002',
    items: [
      { productId: 'prod-003', productName: 'Resaltador amarillo fluorescente', unitPrice: 7.0, quantity: 4 },
    ],
  },
  {
    orderId: 'PEND-003',
    buyerId: 'user-buyer-3',
    locationId: 'loc-003',
    items: [
      { productId: 'prod-004', productName: 'Mouse inalámbrico USB', unitPrice: 60.0, quantity: 1 },
      { productId: 'prod-005', productName: 'Cargador USB-C 65W', unitPrice: 45.0, quantity: 1 },
      { productId: 'prod-006', productName: 'Memoria USB 32GB', unitPrice: 50.0, quantity: 2 },
    ],
  },
  {
    orderId: 'PEND-004',
    buyerId: 'user-buyer-4',
    locationId: 'loc-004',
    items: [
      { productId: 'prod-007', productName: 'Agenda académica 2026', unitPrice: 75.0, quantity: 1 },
    ],
  },
  {
    orderId: 'PEND-005',
    buyerId: 'user-buyer-5',
    locationId: 'loc-005',
    items: [
      { productId: 'prod-008', productName: 'Barbijo quirúrgico descartable x10', unitPrice: 12.0, quantity: 1 },
      { productId: 'prod-009', productName: 'Botella de agua personal 600ml', unitPrice: 10.0, quantity: 2 },
    ],
  },
];

export async function run({ db }) {
  const firestore = db;

  console.log('Clearing existing PEND-* orders...');
  for (const o of pendingOrdersData) {
    const itemsSnap = await firestore
      .collection('orders')
      .doc(o.orderId)
      .collection('orderItems')
      .get();

    const batch = firestore.batch();
    for (const itemDoc of itemsSnap.docs) {
      batch.delete(itemDoc.ref);
    }
    batch.delete(firestore.collection('orders').doc(o.orderId));
    await batch.commit();
  }

  console.log(`Seeding ${pendingOrdersData.length} pending orders for sellerId="${SELLER_ID}"...`);

  for (const o of pendingOrdersData) {
    const total = o.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    await firestore.collection('orders').doc(o.orderId).set({
      orderId: o.orderId,
      buyerId: o.buyerId,
      sellerId: SELLER_ID,
      status: 'CREADO',
      incidentReason: null,
      total,
      locationId: o.locationId,
      paymentStatus: 'PENDIENTE',
      deliveryStatus: null,
      deliveryId: null,
      paymentId: null,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    for (const item of o.items) {
      const itemId = `${o.orderId}-ITEM-${item.productId}`;
      const subtotal = item.unitPrice * item.quantity;

      await firestore
        .collection('orders')
        .doc(o.orderId)
        .collection('orderItems')
        .doc(itemId)
        .set({
          itemId,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal,
        });
    }

    console.log(`  ✓ ${o.orderId} — ${o.items.length} producto(s) — total: ${total} Bs.`);
  }

  console.log('Pending orders seeded successfully.');
}

import admin from 'firebase-admin';

export async function run({ adminApp, db }) {
  const firestore = db;

  const locationsData = [
    { locationId: "loc-001", userId: "user-buyer-1", label: "Facultad de Ciencias y Tecnología", type: "Edificio Nuevo", lat: -17.3938, lng: -66.1465, isDefault: true },
    { locationId: "loc-002", userId: "user-buyer-2", label: "Biblioteca Central UMSS", type: "Planta Baja", lat: -17.3940, lng: -66.1460, isDefault: true },
    { locationId: "loc-003", userId: "user-buyer-3", label: "Facultad de Ciencias Económicas", type: "Auditorio", lat: -17.3945, lng: -66.1470, isDefault: true },
    { locationId: "loc-004", userId: "user-buyer-4", label: "Comedor Universitario", type: "Puerta Principal", lat: -17.3950, lng: -66.1480, isDefault: true },
    { locationId: "loc-005", userId: "user-buyer-1", label: "Facultad de Humanidades", type: "Aula 102", lat: -17.3955, lng: -66.1490, isDefault: false },
    { locationId: "loc-006", userId: "user-buyer-2", label: "Laboratorios MEMI", type: "Piso 2", lat: -17.3960, lng: -66.1500, isDefault: false },
    { locationId: "loc-007", userId: "user-buyer-3", label: "Facultad de Medicina", type: "Entrada Norte", lat: -17.3965, lng: -66.1510, isDefault: false },
    { locationId: "loc-008", userId: "user-buyer-4", label: "Parqueo Tecnología", type: "Caseta Seguridad", lat: -17.3970, lng: -66.1520, isDefault: false },
    { locationId: "loc-009", userId: "user-buyer-5", label: "Instituto de Investigaciones Metalúrgicas", type: "Laboratorio A", lat: -17.3975, lng: -66.1530, isDefault: true },
    { locationId: "loc-010", userId: "user-buyer-6", label: "Facultad de Arquitectura", type: "Talleres", lat: -17.3980, lng: -66.1540, isDefault: true },
    { locationId: "loc-011", userId: "user-buyer-7", label: "Paseo Autonómico", type: "Kiosko Central", lat: -17.3985, lng: -66.1550, isDefault: true },
    { locationId: "loc-012", userId: "user-buyer-8", label: "Facultad de Ciencias Jurídicas", type: "Decanato", lat: -17.3990, lng: -66.1560, isDefault: true },
    { locationId: "loc-013", userId: "user-buyer-9", label: "Puerta Oquendo", type: "Entrada Principal", lat: -17.3920, lng: -66.1450, isDefault: true },
    { locationId: "loc-014", userId: "user-buyer-10", label: "Facultad de Agronomía", type: "Pasillo A", lat: -17.4010, lng: -66.1580, isDefault: true },
    { locationId: "loc-015", userId: "user-buyer-11", label: "Aula Magna", type: "Sótano", lat: -17.3930, lng: -66.1475, isDefault: true },
    { locationId: "loc-016", userId: "user-buyer-12", label: "Cancha de Fútbol", type: "Graderías", lat: -17.3948, lng: -66.1495, isDefault: true },
    { locationId: "loc-017", userId: "user-buyer-13", label: "Edificio de Idiomas", type: "Piso 3", lat: -17.3958, lng: -66.1505, isDefault: true }
  ];

  const ordersData = [
    { orderId: "ORD-001", buyerId: "user-buyer-1", status: "Registrado", total: 50.5, locationId: "loc-001", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-001" },
    { orderId: "ORD-002", buyerId: "user-buyer-2", status: "Registrado", total: 120.0, locationId: "loc-002", deliveryStatus: "delivered", deliveryId: "DEL-ORD-002" },
    { orderId: "ORD-003", buyerId: "user-buyer-3", status: "Registrado", total: 35.0, locationId: "loc-003", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-003" },
    { orderId: "ORD-004", buyerId: "user-buyer-4", status: "Registrado", total: 85.2, locationId: "loc-004", deliveryStatus: "delivered", deliveryId: "DEL-ORD-004" },
    { orderId: "ORD-005", buyerId: "user-buyer-1", status: "Registrado", total: 42.0, locationId: "loc-005", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-005" },
    { orderId: "ORD-006", buyerId: "user-buyer-2", status: "Registrado", total: 15.0, locationId: "loc-006", deliveryStatus: "delivered", deliveryId: "DEL-ORD-006" },
    { orderId: "ORD-007", buyerId: "user-buyer-3", status: "Registrado", total: 60.0, locationId: "loc-007", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-007" },
    { orderId: "ORD-008", buyerId: "user-buyer-4", status: "Registrado", total: 25.5, locationId: "loc-008", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-008" },
    { orderId: "ORD-009", buyerId: "user-buyer-1", status: "Registrado", total: 110.0, locationId: "loc-001", deliveryStatus: "delivered", deliveryId: "DEL-ORD-009" },
    { orderId: "ORD-010", buyerId: "user-buyer-2", status: "Registrado", total: 75.0, locationId: "loc-003", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-010" },
    { orderId: "ORD-011", buyerId: "user-buyer-5", status: "Registrado", total: 45.0, locationId: "loc-009", deliveryStatus: "delivered", deliveryId: "DEL-ORD-011" },
    { orderId: "ORD-012", buyerId: "user-buyer-6", status: "Registrado", total: 30.0, locationId: "loc-010", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-012" },
    { orderId: "ORD-013", buyerId: "user-buyer-7", status: "Registrado", total: 22.5, locationId: "loc-011", deliveryStatus: "delivered", deliveryId: "DEL-ORD-013" },
    { orderId: "ORD-014", buyerId: "user-buyer-8", status: "Registrado", total: 95.0, locationId: "loc-012", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-014" },
    { orderId: "ORD-015", buyerId: "user-buyer-1", status: "Registrado", total: 66.0, locationId: "loc-002", deliveryStatus: "delivered", deliveryId: "DEL-ORD-015" },
    { orderId: "ORD-016", buyerId: "user-buyer-3", status: "Registrado", total: 18.0, locationId: "loc-007", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-016" },
    { orderId: "ORD-017", buyerId: "user-buyer-5", status: "Registrado", total: 140.0, locationId: "loc-009", deliveryStatus: "delivered", deliveryId: "DEL-ORD-017" },
    { orderId: "ORD-018", buyerId: "user-buyer-7", status: "Registrado", total: 55.0, locationId: "loc-011", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-018" },
    { orderId: "ORD-019", buyerId: "user-buyer-2", status: "Registrado", total: 88.0, locationId: "loc-006", deliveryStatus: "delivered", deliveryId: "DEL-ORD-019" },
    { orderId: "ORD-020", buyerId: "user-buyer-4", status: "Registrado", total: 33.5, locationId: "loc-008", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-020" },
    { orderId: "ORD-021", buyerId: "user-buyer-9", status: "Registrado", total: 45.5, locationId: "loc-013", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-021" },
    { orderId: "ORD-022", buyerId: "user-buyer-10", status: "Registrado", total: 150.0, locationId: "loc-014", deliveryStatus: "delivered", deliveryId: "DEL-ORD-022" },
    { orderId: "ORD-023", buyerId: "user-buyer-11", status: "Registrado", total: 22.0, locationId: "loc-015", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-023" },
    { orderId: "ORD-024", buyerId: "user-buyer-12", status: "Registrado", total: 78.5, locationId: "loc-016", deliveryStatus: "delivered", deliveryId: "DEL-ORD-024" },
    { orderId: "ORD-025", buyerId: "user-buyer-13", status: "Registrado", total: 112.0, locationId: "loc-017", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-025" },
    { orderId: "ORD-026", buyerId: "user-buyer-1", status: "Registrado", total: 34.0, locationId: "loc-001", deliveryStatus: "delivered", deliveryId: "DEL-ORD-026" },
    { orderId: "ORD-027", buyerId: "user-buyer-3", status: "Registrado", total: 19.5, locationId: "loc-005", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-027" },
    { orderId: "ORD-028", buyerId: "user-buyer-5", status: "Registrado", total: 88.0, locationId: "loc-009", deliveryStatus: "delivered", deliveryId: "DEL-ORD-028" },
    { orderId: "ORD-029", buyerId: "user-buyer-7", status: "Registrado", total: 12.5, locationId: "loc-011", deliveryStatus: "in_transit", deliveryId: "DEL-ORD-029" },
    { orderId: "ORD-030", buyerId: "user-buyer-9", status: "Registrado", total: 67.0, locationId: "loc-013", deliveryStatus: "delivered", deliveryId: "DEL-ORD-030" }
  ];

  console.log('Seeding 30 orders with complete schema...');

  for (const loc of locationsData) {
    await firestore.collection('locations').doc(loc.locationId).set({
      ...loc,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  for (const o of ordersData) {
    const paymentStatus = o.deliveryStatus === 'delivered' ? 'Pagado' : 'Pendiente';
    await firestore.collection('orders').doc(o.orderId).set({
      ...o,
      sellerId: "seller-demo-1",
      incidentReason: "",
      paymentStatus,
      paymentId: `PAY-${o.orderId}`,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const itemRef = firestore.collection('orders').doc(o.orderId).collection('orderItems').doc(`ITEM-${o.orderId.split('-')[1]}`);
    await itemRef.set({
      itemId: `ITEM-${o.orderId.split('-')[1]}`,
      productId: "prod-demo",
      productName: "Producto de Prueba",
      unitPrice: o.total,
      quantity: 1,
      subtotal: o.total
    });

    await firestore.collection('deliveries').doc(o.deliveryId).set({
      deliveryId: o.deliveryId,
      orderId: o.orderId,
      courierId: "courier-demo-1",
      status: o.deliveryStatus,
      deliveryCode: `DEMO-${o.orderId.split('-')[1]}`,
      attemptNumber: 1,
      incidentReason: "",
      evidenceUrl: "",
      failureReason: "",
      amountCollected: paymentStatus === 'Pagado' ? o.total : 0,
      customerConfirmed: o.deliveryStatus === 'delivered',
      customerConfirmedAt: o.deliveryStatus === 'delivered' ? admin.firestore.FieldValue.serverTimestamp() : null,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      pickedUpAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveredAt: o.deliveryStatus === 'delivered' ? admin.firestore.FieldValue.serverTimestamp() : null,
      inTransitAt: admin.firestore.FieldValue.serverTimestamp(),
      failedAt: null,
      reprogrammedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('Seeding finished successfully with 30 orders.');
}

import admin from 'firebase-admin';

const deliveryOrders = [
  {
    id: 'ORD-1041',
    buyerId: 'buyer-001',
    buyerName: 'Camila Rojas',
    assignedMessengerId: 'juan.mensajero',
    assignedMessengerName: 'Juan',
    deliveryLocationLabel: 'Aula 693B - Facultad de Tecnologia',
    status: 'ASSIGNED',
  },
  {
    id: 'ORD-1042',
    buyerId: 'buyer-002',
    buyerName: 'Mateo Soria',
    assignedMessengerId: 'juan.mensajero',
    assignedMessengerName: 'Juan',
    deliveryLocationLabel: 'Biblioteca central - ingreso norte',
    status: 'ASSIGNED',
  },
  {
    id: 'ORD-1043',
    buyerId: 'buyer-003',
    buyerName: 'Lucia Vargas',
    assignedMessengerId: 'lucas.mensajero',
    assignedMessengerName: 'Lucas',
    deliveryLocationLabel: 'Laboratorio 2 - modulo sur',
    status: 'ASSIGNED',
  },
];

export async function run({ db }) {
  const firestore = db;

  console.log('Seeding delivery orders...');

  for (const order of deliveryOrders) {
    const orderRef = firestore.collection('orders').doc(order.id);

    await orderRef.set(
      {
        ...order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log('Upserted delivery order', order.id);
  }

  console.log('seed-delivery-orders complete');
}

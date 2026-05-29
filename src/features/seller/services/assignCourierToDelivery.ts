import { collection, doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";

export const assignCourierToDelivery = async (db: Firestore, orderId: string, courierId: string): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const deliveryRef = doc(collection(db, 'deliveries'));
    const deliveryId = deliveryRef.id;
    const deliveryCode = `DEL-${Date.now().toString(36).toUpperCase()}`;

    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) throw new Error('Order no existe.');

    tx.update(orderRef, {
      status: 'ASIGNADO',
      deliveryId,
      deliveryStatus: 'ASIGNADO',
      updatedAt: serverTimestamp(),
    });

    tx.set(deliveryRef, {
      orderId,
      courierId: courierId,
      status: 'assigned',
      deliveryCode,
      attemptNumber: 1,
      incidentReason: null,
      evidenceUrl: null,
      failureReason: null,
      amountCollected: null,
      customerConfirmed: false,
      customerConfirmedAt: null,
      pickedUpAt: null,
      inTransitAt: null,
      deliveredAt: null,
      failedAt: null,
      reprogrammedAt: null,
      createdAt: serverTimestamp(),
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  })
}

export const reassignCourierToDelivery = async (db: Firestore, deliveryId: string, orderId: string, courierId: string): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    const orderRef = doc(db, 'orders', orderId);

    const deliverySnap = await tx.get(deliveryRef);
    const orderSnap = await tx.get(orderRef);

    if (!deliverySnap.exists()) throw new Error('Delivery no existe.');
    if (!orderSnap.exists()) throw new Error('Order no existe.');

    const orderData: any = orderSnap.data();

    if (orderData.status !== 'PENDIENTE REASIGNACION') {
      throw new Error('No se puede asignar mensajero a un pedido que no está en estado ASIGNADO.');
    }

    tx.update(deliveryRef, {
      courierId: courierId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(orderRef, {
      status: 'ASIGNADO',
      deliveryStatus: 'ASIGNADO',
      updatedAt: serverTimestamp(),
    });
  })
}

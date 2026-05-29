import { collection, doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";

export const markOrderReady = async (db: Firestore, orderId: string, sellerId: string): Promise<{ deliveryId: string }> => {
  const orderRef = doc(db, 'orders', orderId);

  const deliveryRef = doc(collection(db, 'deliveries'));
  const deliveryId = deliveryRef.id;
  const deliveryCode = `DEL-${Date.now().toString(36).toUpperCase()}`;

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const current = orderSnap.data();

    if (current.status !== 'EMPAQUETADO') {
      throw new Error(
        `El pedido ya no está en EMPAQUETADO (estado actual: ${current.status}).`,
      );
    }

    tx.update(orderRef, {
      status: 'LISTO',
      deliveryStatus: 'CREADO',
      deliveryId,
      sellerId,
      updatedAt: serverTimestamp(),
    });

    tx.set(deliveryRef, {
      orderId,
      courierId: null,
      status: 'CREADO',
      deliveryCode,
      attemptNumber: 1,
      incidentReason: null,
      evidenceUrl: null,
      failureReason: null,
      amountCollected: null,
      customerConfirmed: false,
      customerConfirmedAt: null,
      assignedAt: null,
      pickedUpAt: null,
      inTransitAt: null,
      deliveredAt: null,
      failedAt: null,
      reprogrammedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { deliveryId };
}

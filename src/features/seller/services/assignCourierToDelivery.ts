import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";

export const assignCourierToDelivery = async (db: Firestore, deliveryId: string, orderId: string, courierId: string, reassing: boolean = false): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    const orderRef = doc(db, 'orders', orderId);

    const deliverySnap = await tx.get(deliveryRef);
    const orderSnap = await tx.get(orderRef);

    if (!deliverySnap.exists()) throw new Error('Delivery no existe.');
    if (!orderSnap.exists()) throw new Error('Order no existe.');

    const orderData: any = orderSnap.data();

    if (reassing && orderData.status !== 'PENDIENTE REASIGNACION') {
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

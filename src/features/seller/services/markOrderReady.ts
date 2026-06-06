import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";

export const markOrderReady = async (db: Firestore, orderId: string, sellerId: string): Promise<void> => {
  const orderRef = doc(db, 'orders', orderId);

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
      sellerId,
      updatedAt: serverTimestamp(),
    });
  });
}

import { doc, getDoc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import { registrarActividadVendedor } from '../../admin/monitoring/services/sellerActivityService';

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

  // ── HU #160: Registrar actividad del vendedor ──
  const sellerSnap = await getDoc(doc(db, 'users', sellerId));
  const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
 
  registrarActividadVendedor({
    sellerId,
    sellerName: sellerData.displayName ?? 'Vendedor',
    sellerEmail: sellerData.email ?? '',
    actionType: 'MARCAR_LISTO',
    orderId,
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
  }).catch((err) => console.error('No se pudo registrar la actividad del vendedor:', err));
}

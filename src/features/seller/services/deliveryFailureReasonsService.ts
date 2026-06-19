import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  type Firestore,
  type Timestamp,
  where,
} from 'firebase/firestore';

export const DELIVERY_FAILURE_REASONS_COLLECTION = 'deliveryFailures';
export const DELIVERY_FAILURE_ORDER_STATUS = 'RECHAZADO';

export const DELIVERY_FAILURE_REASON_OPTIONS = [
  'Cliente ausente',
  'Direccion incorrecta',
  'Producto rechazado por el cliente',
  'Producto dañado o incompleto',
  'Error en el pedido',
  'Otro',
] as const;

export type DeliveryFailureReason =
	(typeof DELIVERY_FAILURE_REASON_OPTIONS)[number];

export interface DeliveryFailureReasonRecord {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string | null;
  buyerName: string | null;
  reason: DeliveryFailureReason;
  description: string | null;
  orderStatus: string;
  registeredBy: string;
  registeredByName: string;
  registeredAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface RegisterDeliveryFailureReasonParams {
  db: Firestore;
  orderId: string;
  sellerId: string;
  sellerName: string;
  buyerId?: string;
  buyerName?: string;
  reason: DeliveryFailureReason;
  description?: string;
}

export async function registerDeliveryFailureReason({
  db,
  orderId,
  sellerId,
  sellerName,
  buyerId,
  buyerName,
  reason,
  description,
}: RegisterDeliveryFailureReasonParams): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const failureRef = doc(collection(db, DELIVERY_FAILURE_REASONS_COLLECTION), orderId);
  const customerReturnReasonsSnap = await getDocs(
    query(collection(db, 'returns'), where('orderId', '==', orderId)),
  );

  if (!customerReturnReasonsSnap.empty) {
    throw new Error('El cliente ya registro el motivo de este pedido.');
  }

  await runTransaction(db, async (tx) => {
    const [orderSnap, failureSnap] = await Promise.all([
      tx.get(orderRef),
      tx.get(failureRef),
    ]);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const orderData = orderSnap.data();

    if (orderData.sellerId !== sellerId) {
      throw new Error('No puedes registrar motivos de pedidos de otro vendedor.');
    }

    if (orderData.status !== DELIVERY_FAILURE_ORDER_STATUS) {
      throw new Error(`Solo se pueden registrar motivos de pedidos ${DELIVERY_FAILURE_ORDER_STATUS}. Estado actual: ${orderData.status}.`);
    }

    if (failureSnap.exists()) {
      throw new Error('Este pedido ya tiene un motivo registrado.');
    }

    const cleanDescription = description?.trim() || null;

    tx.set(failureRef, {
      orderId,
      sellerId,
      buyerId: buyerId || orderData.buyerId || null,
      buyerName: buyerName || orderData.customerName || null,
      reason,
      description: cleanDescription,
      orderStatus: orderData.status,
      registeredBy: sellerId,
      registeredByName: sellerName,
      registeredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(orderRef, {
      deliveryFailureReason: reason,
      deliveryFailureDescription: cleanDescription,
      deliveryFailureRegisteredAt: serverTimestamp(),
      deliveryFailureRegisteredBy: sellerId,
      updatedAt: serverTimestamp(),
    });
  });
}

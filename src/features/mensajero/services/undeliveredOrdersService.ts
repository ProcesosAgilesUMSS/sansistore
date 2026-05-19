import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../lib/firebase';
import type { CourierOrder } from '../types';

interface SaveUndeliveredOrderParams {
  order: CourierOrder;
  reason: string;
  notes: string;
}

export const saveUndeliveredOrder = async ({
  order,
  reason,
  notes,
}: SaveUndeliveredOrderParams) => {
  const data = {
    orderId: order.id,
    orderCode: order.orderCode,

    buyerName: order.buyerName,
    deliveryZone: order.deliveryZone,

    reason,
    notes,

    status: 'No entregado',

    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,

    total: order.total,

    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, 'undelivered_orders'),
    data
  );

  return docRef.id;
};
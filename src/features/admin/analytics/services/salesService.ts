import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { SalesSummary, SalesFilterInput, SaleOrder } from '../types';

const COLLECTION = 'orders';

// Estados que representan un pedido exitoso (generan ingreso)
// Incluimos ambos: el estado real del sistema Y el del seeder
const COMPLETED_STATUSES = ['ENTREGADO', 'COMPLETADO', 'PAGADO'];

// Estados que representan un pedido cancelado
const CANCELLED_STATUSES = ['CANCELADO', 'NO ENTREGADO'];

export const getSalesByDateRange = async (
  input: SalesFilterInput
): Promise<SalesSummary> => {

  const startTimestamp = Timestamp.fromDate(input.startDate);

  // Fin del día seleccionado (23:59:59)
  const endOfDay = new Date(input.endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  const q = query(
    collection(db, COLLECTION),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  const orders: SaleOrder[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      orderId: doc.id,
      buyerId: data.buyerId ?? '',
      total: data.total ?? 0,
      status: data.status ?? '',
      createdAt: data.createdAt?.toDate() ?? new Date(),
    };
  });

  // Completados: ENTREGADO (real) | COMPLETADO | PAGADO (seeder)
  const completedOrders = orders.filter(
    (o) => COMPLETED_STATUSES.includes(o.status)
  ).length;

  // Cancelados: CANCELADO (real) | NO ENTREGADO
  const cancelledOrders = orders.filter(
    (o) => CANCELLED_STATUSES.includes(o.status)
  ).length;

  // Ingresos: suma de pedidos completados únicamente
  const totalIncome = orders
    .filter((o) => COMPLETED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrders: orders.length,
    totalIncome,
    completedOrders,
    cancelledOrders,
    orders,
  };
};
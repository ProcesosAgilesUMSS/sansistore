// cancelledOrdersService.ts — HU #163: Reporte de pedidos cancelados
// Área 7: Administración & Analítica
//
// Este service lee la colección orders en Firestore filtrando
// por status = "CANCELADO" y cancelledAt dentro del período.
// Sigue el mismo patrón que accessLogService.ts y salesService.ts

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { CancelledOrder, CancelledOrdersFilter, CancelledOrdersSummary } from '../types';

const COLLECTION = 'orders';

// ── getDateRangeFromPeriod ───────────────────────────────────────
// Calcula el rango de fechas según el período seleccionado
const getDateRangeFromPeriod = (period: 'day' | 'week' | 'month') => {
  const now = new Date();
  const start = new Date();

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// ── getCancelledOrdersByPeriod ───────────────────────────────────
// Obtiene todos los pedidos con status = "CANCELADO"
// dentro del período seleccionado (día, semana o mes).
//
// Nota: cancelledAt puede ser null en registros antiguos,
// en ese caso se usa updatedAt como fallback.
export const getCancelledOrdersByPeriod = async (
  filter: CancelledOrdersFilter
): Promise<CancelledOrder[]> => {
  const { start, end } = filter.startDate && filter.endDate
    ? { start: filter.startDate, end: filter.endDate }
    : getDateRangeFromPeriod(filter.period);

  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'CANCELADO'),
  );

  const snapshot = await getDocs(q);

  const orders: CancelledOrder[] = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const cancelDate =
        data.cancelledAt?.toDate() ??
        data.updatedAt?.toDate() ??
        new Date();
      return {
        orderId: data.orderId ?? doc.id,
        cancelledAt: cancelDate,
        customerName: data.customerName ?? 'Sin nombre',
        total: data.total ?? 0,
        incidentReason: data.incidentReason ?? null,
      };
    })
    // Aquí sí filtramos por período en memoria
    .filter((order) => order.cancelledAt >= start && order.cancelledAt <= end);

  orders.sort((a, b) => b.cancelledAt.getTime() - a.cancelledAt.getTime());

  return orders;
};

// ── getCancelledOrdersSummary ────────────────────────────────────
// Calcula el resumen: total cancelados y % vs total de pedidos
export const getCancelledOrdersSummary = async (): Promise<CancelledOrdersSummary> => {
  // Sin ningún filtro — contamos todo globalmente
  const totalQ = query(collection(db, COLLECTION));
  const cancelledQ = query(
    collection(db, COLLECTION),
    where('status', '==', 'CANCELADO'),
  );

  const [totalSnap, cancelledSnap] = await Promise.all([
    getDocs(totalQ),
    getDocs(cancelledQ),
  ]);

  const totalOrders = totalSnap.size;
  const totalCancelled = cancelledSnap.size;
  const cancellationPercentage = totalOrders > 0
    ? Math.round((totalCancelled / totalOrders) * 100)
    : 0;

  return { totalCancelled, cancellationPercentage };
};
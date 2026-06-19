// demandService.ts — HU #149: Análisis de demanda por horarios
// Área 7: Administración & Analítica — Nova 2.0

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { DemandSummary, DemandFilterInput } from '../types';

const COLLECTION = 'orders';

export const getDemandByHour = async (
  input: DemandFilterInput
): Promise<DemandSummary> => {

  const startOfDay = new Date(input.startDate);
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = Timestamp.fromDate(startOfDay);

  const endOfDay = new Date(input.endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  const q = query(
    collection(db, COLLECTION),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);

  // Inicializar 24 horas en 0
  const hourCounts: number[] = Array(24).fill(0);

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const createdAt: Date = data.createdAt?.toDate() ?? new Date();

    // Filtrar por categoría si se especificó
    if (input.categoryId && input.categoryId !== 'todas') {
      const itemCategoryId = data.categoryId;
      if (itemCategoryId && itemCategoryId !== input.categoryId) return;
    }

    const hour = createdAt.getHours();
    hourCounts[hour]++;
  });

  const totalOrders = hourCounts.reduce((a, b) => a + b, 0);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const nonZero = hourCounts.filter((v) => v > 0);
  const minHour = hourCounts.indexOf(Math.min(...(nonZero.length ? nonZero : [0])));
  const avgPerHour = totalOrders > 0 ? totalOrders / 24 : 0;

  const top5 = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const byHour = hourCounts.map((count, hour) => ({
    hour,
    count,
    label: `${String(hour).padStart(2, '0')}:00`,
  }));

  return {
    byHour,
    totalOrders,
    peakHour,
    minHour,
    avgPerHour: Math.round(avgPerHour * 10) / 10,
    top5,
  };
};
// salesService.ts
// HU #161 — Reportes de ventas por fecha
// Área 7: Administración & Analítica — Nova 2.0
//
// Este service hace queries sobre la colección orders de Firestore
// filtrando por el campo createdAt dentro de un rango de fechas.
// Sigue el mismo patrón que categoryService.ts

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

// ── getSalesByDateRange ──────────────────────────────────────────
// Consulta todos los pedidos cuyo createdAt esté dentro del rango
// startDate - endDate (ambos inclusive)
//
// ¿Por qué usamos Timestamp.fromDate()?
// Firestore almacena fechas como Timestamp, no como Date de JavaScript.
// Necesitamos convertir el Date del formulario al formato de Firestore
// para que la comparación funcione correctamente.
export const getSalesByDateRange = async (
  input: SalesFilterInput
): Promise<SalesSummary> => {

  // Convertir Date a Timestamp de Firestore
  const startTimestamp = Timestamp.fromDate(input.startDate);

  // Para que endDate sea inclusivo (hasta el final del día),
  // ponemos la hora al 23:59:59 del día seleccionado
  const endOfDay = new Date(input.endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  // Query sobre colección orders filtrando por createdAt
  // orderBy es necesario cuando usamos where con rangos (>, <, >=, <=)
  const q = query(
    collection(db, COLLECTION),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  // Construir el array de pedidos del período
  const orders: SaleOrder[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      orderId: doc.id,
      buyerId: data.buyerId ?? '',
      total: data.total ?? 0,
      status: data.status ?? '',
      // Convertir Timestamp de Firestore a Date de JavaScript
      createdAt: data.createdAt?.toDate() ?? new Date(),
    };
  });

  // Calcular KPIs del período
  // completedOrders: pedidos con status ENTREGADO
  const completedOrders = orders.filter((o) => o.status === 'ENTREGADO').length;

  // cancelledOrders: pedidos con status CANCELADO
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELADO').length;

  // totalIncome: solo suma los pedidos ENTREGADO (los cancelados no generan ingreso)
  const totalIncome = orders
    .filter((o) => o.status === 'ENTREGADO')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrders: orders.length,
    totalIncome,
    completedOrders,
    cancelledOrders,
    orders,
  };
};
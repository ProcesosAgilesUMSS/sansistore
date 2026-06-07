// sellerActivityService.ts — HU #160: Monitoreo de actividad de vendedores
// Área 7: Administración & Analítica
//
// Este service escribe y lee la colección sellerActivityLogs en Firestore.
// Sigue el mismo patrón que accessLogService.ts

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type {
  SellerActivityLog,
  CreateSellerActivityInput,
  SellerActivityFilter,
} from '../types_monitoring';

const COLLECTION = 'sellerActivityLogs';

// ── registrarActividadVendedor ────────────────────────────────
// Crea un nuevo documento en sellerActivityLogs cada vez que
// un vendedor realiza una acción sobre un pedido.
//
// ¿Cuándo se llama?
// - Cuando el vendedor reserva, cancela, marca listo, asigna,
//   reasigna, marca pagada o marca devuelta un pedido.
export const registrarActividadVendedor = async (
  input: CreateSellerActivityInput
): Promise<void> => {
  await addDoc(collection(db, COLLECTION), {
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    sellerEmail: input.sellerEmail,
    actionType: input.actionType,
    orderId: input.orderId,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    timestamp: serverTimestamp(),
  });
};

// ── getSellerActivityLogs ─────────────────────────────────────
// Obtiene los registros de actividad con filtros opcionales.
export const getSellerActivityLogs = async (
  filter?: SellerActivityFilter
): Promise<SellerActivityLog[]> => {
  let q = query(collection(db, COLLECTION));

  if (filter?.startDate) {
    const start = new Date(filter.startDate);
    start.setHours(0, 0, 0, 0);
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(start)));
  }
  if (filter?.endDate) {
    const endOfDay = new Date(filter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(endOfDay)));
  }

  const snapshot = await getDocs(q);

  const logs: SellerActivityLog[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      logId: doc.id,
      sellerId: data.sellerId ?? '',
      sellerName: data.sellerName ?? '',
      sellerEmail: data.sellerEmail ?? '',
      actionType: data.actionType ?? 'RESERVAR',
      orderId: data.orderId ?? '',
      previousStatus: data.previousStatus ?? '',
      newStatus: data.newStatus ?? '',
      timestamp: data.timestamp?.toDate() ?? new Date(),
    };
  });

  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  let filtered = logs;

  if (filter?.actionType && filter.actionType !== 'ALL') {
    filtered = filtered.filter((log) => log.actionType === filter.actionType);
  }

  if (filter?.sellerId && filter.sellerId !== 'todos') {
    filtered = filtered.filter((log) => log.sellerId === filter.sellerId);
  }

  return filtered;
};

// ── getSellers ────────────────────────────────────────────────
// Obtiene la lista de vendedores únicos desde los logs existentes.
// Esto evita depender de otra colección.
export const getSellersFromLogs = async (): Promise<
  { sellerId: string; sellerName: string }[]
> => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const sellersMap = new Map<string, string>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.sellerId && data.sellerName) {
      sellersMap.set(data.sellerId, data.sellerName);
    }
  });

  return Array.from(sellersMap.entries())
    .map(([sellerId, sellerName]) => ({ sellerId, sellerName }))
    .sort((a, b) => a.sellerName.localeCompare(b.sellerName));
};
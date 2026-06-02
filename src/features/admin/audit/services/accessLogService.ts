// accessLogService.ts — HU #159: Registro de accesos al sistema
// Área 7: Administración & Analítica — Nova 2.0
//
// Este service escribe y lee la colección accessLogs en Firestore.
// Sigue el mismo patrón que categoryService.ts y salesService.ts

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
import type { AccessLog, CreateAccessLogInput, AccessLogFilter } from '../types';

const COLLECTION = 'accessLogs';

// ── registrarAcceso ─────────────────────────────────────────────
// Crea un nuevo documento en accessLogs cada vez que un usuario
// hace LOGIN o LOGOUT.
//
// ¿Cuándo se llama?
// - LOGIN: después del signInWithEmailAndPassword o signInWithPopup exitoso
// - LOGOUT: antes del signOut(auth)
export const registrarAcceso = async (
  input: CreateAccessLogInput
): Promise<void> => {
  await addDoc(collection(db, COLLECTION), {
    uid: input.uid,
    displayName: input.displayName,
    email: input.email,
    roles: input.roles,
    action: input.action,
    // status ACTIVO en LOGIN, CERRADO en LOGOUT
    status: input.action === 'LOGIN' ? 'ACTIVO' : 'CERRADO',
    timestamp: serverTimestamp(),
  });
};

// ── getAccessLogs ───────────────────────────────────────────────
// Obtiene los registros de la bitácora con filtros opcionales.
// Por defecto retorna los últimos 100 registros ordenados por fecha.
export const getAccessLogs = async (
  filter?: AccessLogFilter
): Promise<AccessLog[]> => {
  // Construir la query base sin orderBy para evitar requerir índices compuestos
  let q = query(collection(db, COLLECTION));

  // Aplicar filtro de fechas si se proporcionó
  if (filter?.startDate) {
    const start = new Date(filter.startDate);
    start.setHours(0, 0, 0, 0);
    const startTimestamp = Timestamp.fromDate(start);
    q = query(q, where('timestamp', '>=', startTimestamp));
  }
  if (filter?.endDate) {
    const endOfDay = new Date(filter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(endOfDay)));
  }

  // Aplicar filtro de acción (LOGIN/LOGOUT)
  if (filter?.action && filter.action !== 'ALL') {
    q = query(q, where('action', '==', filter.action));
  }

  const snapshot = await getDocs(q);

  const logs: AccessLog[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      logId: doc.id,
      uid: data.uid ?? '',
      displayName: data.displayName ?? '',
      email: data.email ?? '',
      roles: data.roles ?? [],
      action: data.action ?? 'LOGIN',
      status: data.status ?? 'CERRADO',
      timestamp: data.timestamp?.toDate() ?? new Date(),
    };
  });

  // Ordenar en memoria por timestamp descendente (más recientes primero)
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Si se especificó filtro de rol, filtramos en memoria
  // (Firestore no permite where sobre arrays con múltiples condiciones)
  if (filter?.role && filter.role !== 'todos') {
    return logs.filter((log) => log.roles.includes(filter.role!));
  }

  return logs;
};
// paymentAuditService.ts - HU #145: Auditoria de cobros
// Lee y escribe la coleccion paymentActivityLogs en Firestore.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../../../../../lib/firebase';
import type {
  CreatePaymentActivityLogInput,
  PaymentAuditFilter,
  PaymentAuditLog,
  PaymentCollector,
  PaymentCollectorRole,
  PaymentMethod,
  PaymentStatus,
} from '../types_payment_audit';

const COLLECTION = 'paymentActivityLogs';

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  cash_on_delivery: 'EFECTIVO',
  contra_entrega: 'EFECTIVO',
  'contra entrega': 'EFECTIVO',
  'pago contra entrega': 'EFECTIVO',
  efectivo: 'EFECTIVO',
  cash: 'EFECTIVO',
  qr: 'QR',
  transferencia: 'TRANSFERENCIA',
  transfer: 'TRANSFERENCIA',
  tarjeta: 'TARJETA',
  card: 'TARJETA',
};

const STATUS_ALIASES: Record<string, PaymentStatus> = {
  cobrado: 'VERIFICADO',
  pagado: 'VERIFICADO',
  paid: 'VERIFICADO',
  validado: 'VERIFICADO',
  verified: 'VERIFICADO',
  verificado: 'VERIFICADO',
  pendiente: 'PENDIENTE',
  pending: 'PENDIENTE',
  rechazado: 'RECHAZADO',
  rejected: 'RECHAZADO',
  cancelado: 'RECHAZADO',
};

const ROLE_ALIASES: Record<string, PaymentCollectorRole> = {
  vendedor: 'VENDEDOR',
  seller: 'VENDEDOR',
  mensajero: 'MENSAJERO',
  courier: 'MENSAJERO',
  admin: 'ADMIN',
  administrador: 'ADMIN',
};
const PAYMENT_METHODS: PaymentMethod[] = ['EFECTIVO', 'QR', 'TRANSFERENCIA', 'TARJETA'];
const PAYMENT_STATUSES: PaymentStatus[] = ['VERIFICADO', 'PENDIENTE', 'RECHAZADO'];
const COLLECTOR_ROLES: PaymentCollectorRole[] = ['VENDEDOR', 'MENSAJERO', 'ADMIN'];

function normalizeKey(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const key = normalizeKey(value);
  const upper = String(value ?? '').toUpperCase();
  return METHOD_ALIASES[key] ?? (PAYMENT_METHODS.includes(upper as PaymentMethod) ? upper as PaymentMethod : 'EFECTIVO');
}

export function normalizePaymentStatus(value: unknown): PaymentStatus {
  const key = normalizeKey(value);
  const upper = String(value ?? '').toUpperCase();
  return STATUS_ALIASES[key] ?? (PAYMENT_STATUSES.includes(upper as PaymentStatus) ? upper as PaymentStatus : 'PENDIENTE');
}

export function normalizeCollectorRole(value: unknown): PaymentCollectorRole {
  const key = normalizeKey(value);
  const upper = String(value ?? '').toUpperCase();
  return ROLE_ALIASES[key] ?? (COLLECTOR_ROLES.includes(upper as PaymentCollectorRole) ? upper as PaymentCollectorRole : 'VENDEDOR');
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return new Date();
}

function mapLog(snapshot: QueryDocumentSnapshot<DocumentData>): PaymentAuditLog {
  const data = snapshot.data();
  const legacyCollector = {
    id: data.collectedById ?? '',
    nombre: data.collectedByName ?? '',
    email: data.collectedByEmail ?? '',
    rol: data.collectedByRole ?? 'VENDEDOR',
  };
  const collectedBy = {
    ...legacyCollector,
    ...(typeof data.collectedBy === 'object' && data.collectedBy ? data.collectedBy : {}),
  } as PaymentCollector;

  return {
    logId: snapshot.id,
    orderId: String(data.orderId ?? ''),
    collectedBy: {
      id: String(collectedBy.id ?? ''),
      nombre: String(collectedBy.nombre ?? ''),
      email: String(collectedBy.email ?? ''),
      rol: normalizeCollectorRole(collectedBy.rol),
    },
    collectedById: String(collectedBy.id ?? ''),
    collectedByName: String(collectedBy.nombre ?? ''),
    collectedByEmail: String(collectedBy.email ?? ''),
    collectedByRole: normalizeCollectorRole(collectedBy.rol),
    amount: typeof data.amount === 'number' ? data.amount : 0,
    paymentMethod: normalizePaymentMethod(data.paymentMethod),
    status: normalizePaymentStatus(data.status),
    timestamp: toDate(data.timestamp),
  };
}

async function getCurrentUserCollector(
  fallbackRole: PaymentCollectorRole
): Promise<PaymentCollector> {
  const user = auth.currentUser;
  if (!user) {
    return {
      id: '',
      nombre: 'Usuario no identificado',
      email: '',
      rol: fallbackRole,
    };
  }

  const userSnap = await getDoc(doc(db, 'users', user.uid)).catch(() => null);
  const data = userSnap?.exists() ? userSnap.data() : {};
  const roles = Array.isArray(data?.roles) ? data.roles : [];
  const role = roles.includes('admin')
    ? 'ADMIN'
    : roles.includes('mensajero')
      ? 'MENSAJERO'
      : roles.includes('vendedor')
        ? 'VENDEDOR'
        : fallbackRole;

  return {
    id: user.uid,
    nombre: data?.displayName ?? user.displayName ?? 'Usuario',
    email: data?.email ?? user.email ?? '',
    rol: role,
  };
}

export const registrarActividadCobro = async (
  input: CreatePaymentActivityLogInput
): Promise<void> => {
  await addDoc(collection(db, COLLECTION), {
    orderId: input.orderId,
    collectedBy: input.collectedBy,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    status: input.status,
    timestamp: serverTimestamp(),
  });
};

export const registrarCobro = registrarActividadCobro;

export async function registrarActividadCobroActual(
  input: Omit<CreatePaymentActivityLogInput, 'collectedBy'> & {
    fallbackRole: PaymentCollectorRole;
  }
): Promise<void> {
  const collectedBy = await getCurrentUserCollector(input.fallbackRole);
  await registrarActividadCobro({
    orderId: input.orderId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    status: input.status,
    collectedBy,
  });
}

function buildConstraints(filter?: PaymentAuditFilter): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filter?.orderId?.trim()) {
    constraints.push(where('orderId', '==', filter.orderId.trim()));
  }

  if (filter?.collectedById && filter.collectedById !== 'todos') {
    constraints.push(where('collectedBy.id', '==', filter.collectedById));
  }

  if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
    constraints.push(where('paymentMethod', '==', filter.paymentMethod));
  }

  if (filter?.startDate) {
    const start = new Date(filter.startDate);
    start.setHours(0, 0, 0, 0);
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(start)));
  }

  if (filter?.endDate) {
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(end)));
  }

  constraints.push(orderBy('timestamp', 'desc'));
  return constraints;
}

export function escucharHistorialCobros(
  filter: PaymentAuditFilter | undefined,
  callback: (logs: PaymentAuditLog[]) => void,
  callbackError?: (error: Error) => void
): Unsubscribe {
  const logsQuery = query(collection(db, COLLECTION), ...buildConstraints(filter));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      callback(snapshot.docs.map(mapLog));
    },
    (error) => {
      callbackError?.(error);
    }
  );
}

export function escucharEncargadosCobros(
  callback: (collectors: { id: string; name: string; role: string }[]) => void,
  callbackError?: (error: Error) => void
): Unsubscribe {
  const logsQuery = query(collection(db, COLLECTION), orderBy('timestamp', 'desc'));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const collectors = new Map<string, { name: string; role: string }>();
      snapshot.docs.map(mapLog).forEach((log) => {
        if (!log.collectedBy.id || !log.collectedBy.nombre) return;
        collectors.set(log.collectedBy.id, {
          name: log.collectedBy.nombre,
          role: log.collectedBy.rol,
        });
      });

      callback(
        Array.from(collectors.entries())
          .map(([id, info]) => ({ id, name: info.name, role: info.role }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    },
    (error) => {
      callbackError?.(error);
    }
  );
}

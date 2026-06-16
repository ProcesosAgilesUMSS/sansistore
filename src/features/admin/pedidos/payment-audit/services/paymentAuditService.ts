// paymentAuditService.ts — HU #145: Auditoría de cobros
// Área 7: Administración & Analítica
//
// Lee la colección paymentActivityLogs en Firestore.
// Sigue el mismo patrón que accessLogService.ts y sellerActivityService.ts

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import type {
    PaymentAuditLog,
    PaymentAuditFilter,
} from '../types_payment_audit';

const COLLECTION = 'paymentActivityLogs';

// ── registrarCobro ───────────────────────────────────────────
// Crea un nuevo documento en paymentActivityLogs cada vez que
// se confirma un cobro sobre un pedido.
export const registrarCobro = async (
    input: Omit<PaymentAuditLog, 'logId' | 'timestamp'>
): Promise<void> => {
    await addDoc(collection(db, COLLECTION), {
        orderId: input.orderId,
        collectedById: input.collectedById,
        collectedByName: input.collectedByName,
        collectedByEmail: input.collectedByEmail,
        collectedByRole: input.collectedByRole,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        status: input.status,
        timestamp: serverTimestamp(),
    });
};

// ── getPaymentAuditLogs ──────────────────────────────────────
// Obtiene los registros de cobros con filtros opcionales.
export const getPaymentAuditLogs = async (
    filter?: PaymentAuditFilter
): Promise<PaymentAuditLog[]> => {
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

    const logs: PaymentAuditLog[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            logId: doc.id,
            orderId: data.orderId ?? '',
            collectedById: data.collectedById ?? '',
            collectedByName: data.collectedByName ?? '',
            collectedByEmail: data.collectedByEmail ?? '',
            collectedByRole: data.collectedByRole ?? 'vendedor',
            amount: typeof data.amount === 'number' ? data.amount : 0,
            paymentMethod: data.paymentMethod ?? 'EFECTIVO',
            status: data.status ?? 'PENDIENTE',
            timestamp: data.timestamp?.toDate() ?? new Date(),
        };
    });

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let filtered = logs;

    if (filter?.orderId && filter.orderId.trim()) {
        const search = filter.orderId.toLowerCase().trim();
        filtered = filtered.filter((log) =>
            log.orderId.toLowerCase().includes(search)
        );
    }

    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
        filtered = filtered.filter((log) => log.paymentMethod === filter.paymentMethod);
    }

    if (filter?.collectedById && filter.collectedById !== 'todos') {
        filtered = filtered.filter((log) => log.collectedById === filter.collectedById);
    }

    return filtered;
};

// ── getCollectors ────────────────────────────────────────────
// Obtiene la lista de encargados únicos desde los logs existentes.
export const getCollectorsFromLogs = async (): Promise<
    { id: string; name: string; role: string }[]
> => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const map = new Map<string, { name: string; role: string }>();

    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.collectedById && data.collectedByName) {
            map.set(data.collectedById, {
                name: data.collectedByName,
                role: data.collectedByRole ?? 'vendedor',
            });
        }
    });

    return Array.from(map.entries())
        .map(([id, info]) => ({ id, name: info.name, role: info.role }))
        .sort((a, b) => a.name.localeCompare(b.name));
};
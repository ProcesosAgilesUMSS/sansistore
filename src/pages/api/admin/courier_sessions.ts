// src/pages/api/admin/courier_sessions.ts

import type { APIRoute } from 'astro';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const devBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';
const devAdminUid = import.meta.env.DEV_ADMIN_UID || 'dev-admin';

const COLLECTION = 'messenger_shift_closures';

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toISO(ts: unknown): string | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'object' && ts !== null && 'toDate' in (ts as any)) {
    return (ts as any).toDate().toISOString();
  }
  if (ts instanceof Date) return ts.toISOString();
  return String(ts);
}

async function requireAdmin(
  request: Request
): Promise<{ uid: string } | { error: Response }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    if (devBypassEnabled) return { uid: devAdminUid };
    return { error: jsonResponse({ message: 'No autenticado.' }, 401) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const roles: string[] = userDoc.data()?.roles ?? [];
    if (roles.includes('admin')) return { uid: decoded.uid };
    if (devBypassEnabled) return { uid: devAdminUid };
    return { error: jsonResponse({ message: 'No tiene permisos de administrador.' }, 403) };
  } catch {
    if (devBypassEnabled) return { uid: devAdminUid };
    return { error: jsonResponse({ message: 'Token de autenticación inválido.' }, 401) };
  }
}

function serializeSummary(data: Record<string, unknown>) {
  const s = (data.summary ?? {}) as Record<string, unknown>;
  return {
    completedCount:    Number(s.completedCount    ?? 0),
    pendingCount:      Number(s.pendingCount      ?? 0),
    notDeliveredCount: Number(s.notDeliveredCount ?? 0),
    cancelledCount:    Number(s.cancelledCount    ?? 0),
    totalCollected:    Number(s.totalCollected    ?? 0),
  };
}

function serializeOrderSnapshot(item: unknown) {
  const d = (item ?? {}) as Record<string, unknown>;
  return {
    id:                   String(d.id              ?? ''),
    deliveryId:           String(d.deliveryId      ?? ''),
    customerName:         String(d.customerName    ?? 'Cliente no registrado'),
    buyerName:            String(d.buyerName       ?? 'Comprador invitado'),
    phone:                String(d.phone           ?? 'Sin teléfono'),
    address:              String(d.address         ?? 'Dirección no registrada'),
    city:                 String(d.city            ?? 'Cochabamba'),
    deliveryStatus:       String(d.deliveryStatus  ?? ''),
    paymentStatus:        String(d.paymentStatus   ?? ''),
    paymentStatusLabel:   String(d.paymentStatusLabel ?? ''),
    cashToCollect:        Number(d.cashToCollect   ?? 0),
    paymentCollectedAt:   toISO(d.paymentCollectedAt),
    assignedAt:           toISO(d.assignedAt),
    updatedAt:            toISO(d.updatedAt),
  };
}

function serializeClosure(
  id: string,
  data: FirebaseFirestore.DocumentData,
  courierName: string,
  validatedByName?: string | null
) {
  return {
    id,
    courierId:        String(data.courierId  ?? ''),
    courierName,
    dateKey:          String(data.dateKey    ?? ''),
    status:           String(data.status     ?? 'closed'),
    startedAt:        toISO(data.startedAt),
    closedAt:         toISO(data.closedAt),
    createdAt:        toISO(data.createdAt),
    summary:          serializeSummary(data),
    completedOrders:  Array.isArray(data.completedOrders)  ? data.completedOrders.map(serializeOrderSnapshot)  : [],
    pendingOrders:    Array.isArray(data.pendingOrders)    ? data.pendingOrders.map(serializeOrderSnapshot)    : [],
    incidentOrders:   Array.isArray(data.incidentOrders)   ? data.incidentOrders.map(serializeOrderSnapshot)   : [],
    validatedBy:      data.validatedBy     ?? null,
    validatedByName:  validatedByName      ?? null,
    validatedAt:      toISO(data.validatedAt),
    rejectionReason:  data.rejectionReason ?? null,
  };
}

// ── GET: listar cierres ───────────────────────────────────────────────────────

export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if ('error' in admin) return admin.error;

  try {
    const url    = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'closed';
    const limitParam = parseInt(url.searchParams.get('limit') ?? '20');
    const limit  = isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 50);
    const cursor = url.searchParams.get('cursor');

    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTION)
      .where('status', '==', status)
      .orderBy('closedAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorSnap = await adminDb.collection(COLLECTION).doc(cursor).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;

    // Resolver nombres de mensajeros en paralelo sin duplicar consultas
    const courierIds = [...new Set(docs.map((d) => d.data().courierId).filter(Boolean))];
    const courierSnaps = await Promise.all(
      courierIds.map((id) => adminDb.collection('users').doc(id).get())
    );
    const courierMap: Record<string, string> = {};
    courierSnaps.forEach((s) => {
      if (s.exists) courierMap[s.id] = s.data()?.displayName ?? s.id;
    });

    const closures = docs.map((d) => {
      const data = d.data();
      return serializeClosure(d.id, data, courierMap[data.courierId] ?? data.courierId);
    });

    const nextCursor = hasMore ? docs[docs.length - 1].id : null;

    return jsonResponse({ closures, hasMore, nextCursor });
  } catch (err) {
    console.error('[courier_sessions GET]', err);
    return jsonResponse({ message: 'Error interno del servidor.' }, 500);
  }
};

// ── PATCH: aprobar o rechazar un cierre ───────────────────────────────────────

interface PatchBody {
  closureId?: string;
  action?: 'approve' | 'reject';
  rejectionReason?: string;
}

export const PATCH: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if ('error' in admin) return admin.error;

  try {
    let body: PatchBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ message: 'El cuerpo de la solicitud no es válido.' }, 400);
    }

    const closureId      = body.closureId?.trim();
    const action         = body.action;
    const rejectionReason = body.rejectionReason?.trim();

    if (!closureId) {
      return jsonResponse({ message: 'closureId es obligatorio.' }, 400);
    }
    if (action !== 'approve' && action !== 'reject') {
      return jsonResponse({ message: 'action debe ser "approve" o "reject".' }, 400);
    }
    if (action === 'reject' && !rejectionReason) {
      return jsonResponse({ message: 'El motivo de rechazo es obligatorio.' }, 400);
    }

    const closureRef  = adminDb.collection(COLLECTION).doc(closureId);
    const closureSnap = await closureRef.get();

    if (!closureSnap.exists) {
      return jsonResponse({ message: 'Cierre de jornada no encontrado.' }, 404);
    }

    const closureData = closureSnap.data()!;

    // Bloquear si ya fue validado o rechazado
    if (closureData.status === 'validated' || closureData.status === 'rejected') {
      return jsonResponse(
        { message: 'Este cierre ya fue procesado y no puede modificarse nuevamente.' },
        409
      );
    }

    const newStatus = action === 'approve' ? 'validated' : 'rejected';

    const updatePayload: Record<string, unknown> = {
      status:      newStatus,
      validatedBy: admin.uid,
      validatedAt: FieldValue.serverTimestamp(),
    };
    if (action === 'reject') {
      updatePayload.rejectionReason = rejectionReason;
    }

    await closureRef.update(updatePayload);

    // Leer el doc actualizado para devolver el estado real
    const updatedSnap = await closureRef.get();
    const updatedData = updatedSnap.data()!;

    // Resolver nombres
    const courierName      = (await adminDb.collection('users').doc(updatedData.courierId).get()).data()?.displayName ?? updatedData.courierId;
    const validatedBySnap  = await adminDb.collection('users').doc(admin.uid).get();
    const validatedByName  = validatedBySnap.data()?.displayName ?? admin.uid;

    return jsonResponse({
      message: action === 'approve'
        ? 'Cierre aprobado correctamente.'
        : 'Cierre rechazado correctamente.',
      closure: serializeClosure(closureId, updatedData, courierName, validatedByName),
    });
  } catch (err) {
    console.error('[courier_sessions PATCH]', err);
    return jsonResponse({ message: 'Error interno del servidor.' }, 500);
  }
};
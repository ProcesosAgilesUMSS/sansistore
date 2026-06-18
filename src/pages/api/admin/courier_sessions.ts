// src/pages/api/admin/courier_sessions.ts

import type { APIRoute } from 'astro';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const devBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';
const devAdminUid = import.meta.env.DEV_ADMIN_UID || 'dev-admin';

const VALID_STATUSES = ['open', 'closed', 'validated', 'rejected'] as const;
type SessionStatus = (typeof VALID_STATUSES)[number];

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

async function requireAdmin(request: Request): Promise<{ uid: string } | { error: Response }> {
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

async function resolveCourierName(courierId: string): Promise<string> {
  const snap = await adminDb.collection('users').doc(courierId).get();
  return snap.data()?.displayName ?? courierId;
}

function serializeSession(
  id: string,
  data: FirebaseFirestore.DocumentData,
  courierName: string,
  validatedByName?: string | null
) {
  const totalCollected = data.totalCollected ?? 0;
  const expectedAmount = data.expectedAmount ?? 0;
  // Fallback defensivo: si no viene calculada, se calcula aquí
  const differenceAmount =
    typeof data.differenceAmount === 'number'
      ? data.differenceAmount
      : Number((totalCollected - expectedAmount).toFixed(2));

  return {
    sessionId: id,
    courierId: data.courierId,
    courierName,
    totalCollected,
    deliveriesCount: data.deliveriesCount ?? 0,
    expectedAmount,
    differenceAmount,
    status: data.status,
    openedAt: toISO(data.openedAt),
    closedAt: toISO(data.closedAt),
    validatedBy: data.validatedBy ?? null,
    validatedByName: validatedByName ?? null,
    validatedAt: toISO(data.validatedAt),
    rejectionReason: data.rejectionReason ?? null,
    updatedAt: toISO(data.updatedAt),
  };
}

// ── GET: listar cierres (por defecto status=closed) ─────────────────────────────

export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if ('error' in admin) return admin.error;

  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') ?? 'closed') as SessionStatus;
    const limitParam = parseInt(url.searchParams.get('limit') ?? '20');
    const limit = isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 50);
    const cursor = url.searchParams.get('cursor');

    if (!VALID_STATUSES.includes(status)) {
      return jsonResponse({ message: 'El estado solicitado no es válido.' }, 400);
    }

    let query: FirebaseFirestore.Query = adminDb
      .collection('courierSessions')
      .where('status', '==', status)
      .orderBy('closedAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorSnap = await adminDb.collection('courierSessions').doc(cursor).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;

    // Resolver nombres de mensajeros en paralelo, sin duplicar consultas
    const courierIds = [...new Set(docs.map((d) => d.data().courierId).filter(Boolean))];
    const courierSnaps = await Promise.all(
      courierIds.map((id) => adminDb.collection('users').doc(id).get())
    );
    const courierMap: Record<string, string> = {};
    courierSnaps.forEach((s) => {
      if (s.exists) courierMap[s.id] = s.data()?.displayName ?? s.id;
    });

    const sessions = docs.map((d) => {
      const data = d.data();
      return serializeSession(d.id, data, courierMap[data.courierId] ?? data.courierId);
    });

    const nextCursor = hasMore ? docs[docs.length - 1].id : null;

    return jsonResponse({ sessions, hasMore, nextCursor });
  } catch (err) {
    console.error('[courier_sessions GET]', err);
    return jsonResponse({ message: 'Error interno del servidor.' }, 500);
  }
};

// ── PATCH: aprobar o rechazar un cierre ──────────────────────────────────────────

interface PatchBody {
  sessionId?: string;
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

    const sessionId = body.sessionId?.trim();
    const action = body.action;
    const rejectionReason = body.rejectionReason?.trim();

    if (!sessionId) {
      return jsonResponse({ message: 'sessionId es obligatorio.' }, 400);
    }
    if (action !== 'approve' && action !== 'reject') {
      return jsonResponse({ message: 'action debe ser "approve" o "reject".' }, 400);
    }
    if (action === 'reject' && !rejectionReason) {
      return jsonResponse({ message: 'El motivo de rechazo es obligatorio.' }, 400);
    }

    const sessionRef = adminDb.collection('courierSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return jsonResponse({ message: 'Cierre de jornada no encontrado.' }, 404);
    }

    const sessionData = sessionSnap.data()!;

    // Bloquear si ya fue validado o rechazado anteriormente
    if (sessionData.status === 'validated' || sessionData.status === 'rejected') {
      return jsonResponse(
        { message: 'Este cierre ya fue procesado y no puede modificarse nuevamente.' },
        409
      );
    }

    const newStatus: SessionStatus = action === 'approve' ? 'validated' : 'rejected';

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      validatedBy: admin.uid,
      validatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === 'reject') {
      updatePayload.rejectionReason = rejectionReason;
    }

    await sessionRef.update(updatePayload);

    const updatedSnap = await sessionRef.get();
    const updatedData = updatedSnap.data()!;
    const courierName = await resolveCourierName(updatedData.courierId);
    const validatedByName = await resolveCourierName(admin.uid);

    return jsonResponse({
      message: action === 'approve' ? 'Cierre aprobado correctamente.' : 'Cierre rechazado correctamente.',
      session: serializeSession(sessionId, updatedData, courierName, validatedByName),
    });
  } catch (err) {
    console.error('[courier_sessions PATCH]', err);
    return jsonResponse({ message: 'Error interno del servidor.' }, 500);
  }
};
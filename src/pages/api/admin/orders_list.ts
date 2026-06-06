// src/pages/api/admin/orders_list.ts

import type { APIRoute } from 'astro';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

const devBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';

function toISO(ts: unknown): string | null {
  if (!ts) return null;
  if (typeof ts === 'object' && 'toDate' in (ts as any)) {
    return (ts as any).toDate().toISOString();
  }
  if (ts instanceof Date) return ts.toISOString();
  return String(ts);
}

export const GET: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    let uid: string | null = null;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const roles: string[] = userDoc.data()?.roles ?? [];
      if (!roles.includes('admin')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
      }
    } else if (devBypassEnabled) {
      uid = import.meta.env.DEV_ADMIN_UID ?? 'dev-admin';
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    // ── Parámetros ────────────────────────────────────────────────────────
    const url = new URL(request.url);
    const status    = url.searchParams.get('status')    ?? null;
    const limitParam = parseInt(url.searchParams.get('limit') ?? '20');
    const limit     = isNaN(limitParam) ? 20 : Math.min(limitParam, 50);
    const cursor    = url.searchParams.get('cursor')    ?? null; // orderId del último item

    // ── Query base ────────────────────────────────────────────────────────
    let query: FirebaseFirestore.Query = adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1); // +1 para saber si hay más páginas

    if (status) {
      query = query.where('status', '==', status);
    }

    // Paginación por cursor (último documento visto)
    if (cursor) {
      const cursorSnap = await adminDb
        .collection('orders')
        .where('orderId', '==', cursor)
        .limit(1)
        .get();
      if (!cursorSnap.empty) {
        query = query.startAfter(cursorSnap.docs[0]);
      }
    }

    const snap = await query.get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;

    // ── Resolver nombres de compradores en paralelo ───────────────────────
    const buyerIds = [...new Set(docs.map((d) => d.data().buyerId).filter(Boolean))];
    const buyerSnaps = await Promise.all(
      buyerIds.map((id) => adminDb.collection('users').doc(id).get())
    );
    const buyerMap: Record<string, string> = {};
    buyerSnaps.forEach((s) => {
      if (s.exists) buyerMap[s.id] = s.data()?.displayName ?? s.id;
    });

    // ── Mapear resultados ─────────────────────────────────────────────────
    const orders = docs.map((d) => {
      const o = d.data();
      return {
        orderId:       o.orderId,
        customerName:  o.customerName ?? buyerMap[o.buyerId] ?? o.buyerId,
        total:         o.total,
        status:        o.status,
        paymentStatus: o.paymentStatus ?? null,
        deliveryStatus:o.deliveryStatus ?? null,
        createdAt:     toISO(o.createdAt),
        cancelledAt:   toISO(o.cancelledAt),
        incidentReason:o.incidentReason ?? null,
      };
    });

    const nextCursor = hasMore ? orders[orders.length - 1].orderId : null;

    return new Response(
      JSON.stringify({ orders, hasMore, nextCursor }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('[orders_list]', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers,
    });
  }
};
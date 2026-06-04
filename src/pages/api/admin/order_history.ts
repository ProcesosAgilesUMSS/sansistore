// src/pages/api/admin/order_history.ts

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
    const orderId = url.searchParams.get('orderId')?.trim();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId requerido' }), { status: 400, headers });
    }

    // ── Buscar por campo orderId (no por ID de documento) ─────────────────
    const orderQuery = await adminDb
      .collection('orders')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (orderQuery.empty) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404, headers });
    }

    const orderDoc = orderQuery.docs[0];
    const order = orderDoc.data();
    const docId = orderDoc.id; // ID real del documento para subconsultas

    // ── Comprador y vendedor ──────────────────────────────────────────────
    const [buyerSnap, sellerSnap] = await Promise.all([
      adminDb.collection('users').doc(order.buyerId).get(),
      order.sellerId
        ? adminDb.collection('users').doc(order.sellerId).get()
        : Promise.resolve(null),
    ]);
    const buyerName: string  = buyerSnap.data()?.displayName  ?? order.buyerId;
    const sellerName: string = sellerSnap?.data()?.displayName ?? order.sellerId ?? '—';

    // ── Items (subcolección usando ID real del documento) ─────────────────
    const itemsSnap = await adminDb
      .collection('orders').doc(docId)
      .collection('orderItems')
      .get();

    const items = itemsSnap.docs.map((d) => ({ itemId: d.id, ...d.data() }));

    // ── Pago ──────────────────────────────────────────────────────────────
    let payment = null;
    if (order.paymentId) {
      const paySnap = await adminDb.collection('payments').doc(order.paymentId).get();
      if (paySnap.exists) {
        const p = paySnap.data()!;
        payment = {
          paymentId:    paySnap.id,
          orderId:      order.orderId,
          amount:       p.amount,
          method:       p.method,
          status:       p.status,
          registeredBy: p.registeredBy,
          verifiedBy:   p.verifiedBy   ?? null,
          registeredAt: toISO(p.registeredAt),
          verifiedAt:   toISO(p.verifiedAt),
        };
      }
    }
    // Fallback por query
    if (!payment) {
      const payQuery = await adminDb
        .collection('payments')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      if (!payQuery.empty) {
        const p = payQuery.docs[0].data();
        payment = {
          paymentId:    payQuery.docs[0].id,
          orderId:      order.orderId,
          amount:       p.amount,
          method:       p.method,
          status:       p.status,
          registeredBy: p.registeredBy,
          verifiedBy:   p.verifiedBy   ?? null,
          registeredAt: toISO(p.registeredAt),
          verifiedAt:   toISO(p.verifiedAt),
        };
      }
    }

    // ── Entrega ───────────────────────────────────────────────────────────
    let delivery = null;
    const resolveDelivery = async (snap: FirebaseFirestore.DocumentSnapshot) => {
      const d = snap.data()!;
      let courierName = d.courierId;
      const courierSnap = await adminDb.collection('users').doc(d.courierId).get();
      if (courierSnap.exists) courierName = courierSnap.data()?.displayName ?? d.courierId;

      return {
        deliveryId:          snap.id,
        orderId:             order.orderId,
        courierId:           d.courierId,
        courierName,
        status:              d.status,
        deliveryCode:        d.deliveryCode        ?? null,
        attemptNumber:       d.attemptNumber       ?? null,
        incidentReason:      d.incidentReason      ?? null,
        evidenceUrl:         d.evidenceUrl         ?? null,
        failureReason:       d.failureReason       ?? null,
        amountCollected:     d.amountCollected      ?? 0,
        customerConfirmed:   d.customerConfirmed   ?? false,
        customerConfirmedAt: toISO(d.customerConfirmedAt),
        assignedAt:          toISO(d.assignedAt),
        pickedUpAt:          toISO(d.pickedUpAt),
        inTransitAt:         toISO(d.inTransitAt),
        deliveredAt:         toISO(d.deliveredAt),
        failedAt:            toISO(d.failedAt),
        reprogrammedAt:      toISO(d.reprogrammedAt),
      };
    };

    if (order.deliveryId) {
      const delSnap = await adminDb.collection('deliveries').doc(order.deliveryId).get();
      if (delSnap.exists) delivery = await resolveDelivery(delSnap);
    }
    if (!delivery) {
      const delQuery = await adminDb
        .collection('deliveries')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      if (!delQuery.empty) delivery = await resolveDelivery(delQuery.docs[0]);
    }

    // ── Línea de tiempo ───────────────────────────────────────────────────
    type TLEvent = { label: string; detail?: string; timestamp: string | null; type?: string };
    const rawTimeline: TLEvent[] = [];

    const push = (
      label: string,
      timestamp: string | null,
      detail?: string,
      type?: TLEvent['type']
    ) => {
      if (timestamp) rawTimeline.push({ label, detail, timestamp, type });
    };

    push('Pedido creado',        toISO(order.createdAt),   `Comprador: ${buyerName}`,            'info');
    push('Pedido confirmado',    toISO(order.confirmedAt), `Vendedor: ${sellerName}`,             'success');
    push('Pago registrado',      payment?.registeredAt ?? null, payment ? `Método: ${payment.method}` : undefined, 'info');
    push('Asignado a mensajero', delivery?.assignedAt  ?? null, delivery ? `Mensajero: ${delivery.courierName}` : undefined, 'info');
    push('Pedido recogido',      delivery?.pickedUpAt  ?? null, 'Mensajero recogió el pedido',    'info');
    push('En camino',            delivery?.inTransitAt ?? null, 'Mensajero en tránsito',          'info');
    push('Entregado y cobrado',  delivery?.deliveredAt ?? null, delivery ? `Bs. ${delivery.amountCollected} cobrados` : undefined, 'success');
    push('Entrega fallida',      delivery?.failedAt    ?? null, delivery?.failureReason ?? delivery?.incidentReason ?? undefined, 'error');
    push('Entrega reprogramada', delivery?.reprogrammedAt ?? null, undefined,                     'warning');
    push('Confirmado por cliente', delivery?.customerConfirmedAt ?? null, undefined,              'success');
    push('Pago verificado',      payment?.verifiedAt   ?? null, payment?.verifiedBy ? `Verificado por ${payment.verifiedBy}` : undefined, 'success');
    push('Pedido cancelado',     toISO(order.cancelledAt), order.incidentReason ?? undefined,     'error');

    const timeline = rawTimeline
      .filter((e) => e.timestamp)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());

    // ── Respuesta ─────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        orderId:        order.orderId,
        buyerName,
        sellerName,
        customerName:   order.customerName   ?? null,
        customerPhone:  order.customerPhone  ?? null,
        address:        order.address        ?? null,
        total:          order.total,
        status:         order.status,
        paymentStatus:  order.paymentStatus  ?? null,
        deliveryStatus: order.deliveryStatus ?? null,
        createdAt:      toISO(order.createdAt),
        confirmedAt:    toISO(order.confirmedAt),
        cancelledAt:    toISO(order.cancelledAt),
        incidentReason: order.incidentReason ?? null,
        items,
        payment,
        delivery,
        timeline,
      }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('[order_history]', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers,
    });
  }
};
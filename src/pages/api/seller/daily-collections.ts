import type { APIRoute } from 'astro';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

interface CollectionOrder {
  orderId: string;
  total: number;
  collectedAt: string | null;
  buyerReceptionConfirmed: boolean;
  buyerReceptionConfirmedAt: string | null;
}

const COLLECTED_STATUSES = new Set([
  'cobrado',
  'pagado',
  'paid',
  'collected',
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

function normalizeStatus(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_\s-]+/g, '_');
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toAmount(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function getBoliviaDayRange(dateParam: string | null) {
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

  return {
    date,
    start: new Date(`${date}T00:00:00.000-04:00`),
    end: new Date(`${date}T23:59:59.999-04:00`),
  };
}

const devBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';
const devAdminUid = import.meta.env.DEV_ADMIN_UID || 'dev-admin';

async function resolveSellerUid(request: Request): Promise<string | null> {
  if (devBypassEnabled) return devAdminUid;

  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const roles: string[] = userDoc.data()?.roles ?? [];
    if (!roles.includes('vendedor')) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const sellerUid = await resolveSellerUid(request);

  if (!sellerUid) {
    return jsonResponse(
      { error: 'Acceso denegado. Se requiere autenticacion con rol de vendedor.' },
      403,
    );
  }

  const { date, start, end } = getBoliviaDayRange(url.searchParams.get('date'));

  const snapshot = await adminDb
    .collection('orders')
    .where('sellerId', '==', sellerUid)
    .get();

  const collectedOrders: CollectionOrder[] = [];

  for (const orderDoc of snapshot.docs) {
    const data = orderDoc.data();
    const paymentStatus = normalizeStatus(data.paymentStatus);
    const deliveryStatus = normalizeStatus(data.deliveryStatus);
    const orderStatus = normalizeStatus(data.status);
    const isCollected =
      COLLECTED_STATUSES.has(paymentStatus) ||
      ((deliveryStatus === 'delivered' || orderStatus === 'entregado') &&
        orderStatus !== 'cancelado');

    if (!isCollected) continue;

    const collectedAt =
      toDate(data.paymentCollectedAt) ??
      toDate(data.deliveredAt) ??
      toDate(data.updatedAt);

    if (!collectedAt || collectedAt < start || collectedAt > end) continue;

    collectedOrders.push({
      orderId: orderDoc.id,
      total: toAmount(data.total),
      collectedAt: collectedAt.toISOString(),
      buyerReceptionConfirmed: Boolean(data.buyerReceptionConfirmed || data.customerConfirmed),
      buyerReceptionConfirmedAt:
        (toDate(data.buyerReceptionConfirmedAt) ?? toDate(data.customerConfirmedAt))?.toISOString() ??
        null,
    });
  }

  const totalCollected = collectedOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  return jsonResponse({
    date,
    totalCollected,
    orderCount: collectedOrders.length,
    orders: collectedOrders,
  });
};

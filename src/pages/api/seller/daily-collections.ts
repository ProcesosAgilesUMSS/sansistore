import type { APIRoute } from 'astro';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

interface CollectionOrder {
  orderId: string;
  paymentId: string | null;
  total: number;
  collectedAt: string | null;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod: string;
  courierId: string | null;
  courierName: string;
  courierEmail: string | null;
  customerName: string;
  deliveryId: string | null;
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

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
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
  const courierCache = new Map<
    string,
    { name: string; email: string | null }
  >();

  const readCourier = async (courierId: string | null) => {
    if (!courierId) return { name: 'Mensajero no identificado', email: null };
    if (courierCache.has(courierId)) return courierCache.get(courierId)!;

    const courierDoc = await adminDb.collection('users').doc(courierId).get();
    const courier = courierDoc.data();
    const value = {
      name:
        getString(courier?.displayName) ||
        getString(courier?.name) ||
        getString(courier?.email) ||
        courierId,
      email: getString(courier?.email) || null,
    };

    courierCache.set(courierId, value);
    return value;
  };

  for (const orderDoc of snapshot.docs) {
    const data = orderDoc.data();
    const paymentId = getString(data.paymentId) || null;
    const paymentDoc = paymentId
      ? await adminDb.collection('payments').doc(paymentId).get()
      : null;
    const payment = paymentDoc?.exists ? paymentDoc.data() : null;
    const paymentStatus = normalizeStatus(
      payment?.status ?? data.paymentStatus
    );
    if (!COLLECTED_STATUSES.has(paymentStatus)) continue;

    const collectedAt =
      toDate(payment?.collectedAt) ??
      toDate(data.paymentCollectedAt) ??
      toDate(data.deliveredAt) ??
      toDate(data.updatedAt);

    if (!collectedAt || collectedAt < start || collectedAt > end) continue;

    const deliverySnapshot = await adminDb
      .collection('deliveries')
      .where('orderId', '==', orderDoc.id)
      .limit(1)
      .get();
    const deliveryDoc = deliverySnapshot.docs[0];
    const delivery = deliveryDoc?.data();
    const courierId =
      getString(payment?.collectedBy) ||
      getString(data.collectedBy) ||
      getString(delivery?.courierId) ||
      null;

    if (!courierId) continue;

    const courier = await readCourier(courierId);

    collectedOrders.push({
      orderId: orderDoc.id,
      paymentId,
      total: toAmount(payment?.amount ?? data.total),
      collectedAt: collectedAt.toISOString(),
      paymentStatus: getString(payment?.status ?? data.paymentStatus, 'COBRADO'),
      paymentStatusLabel: getString(
        payment?.statusLabel ?? data.paymentStatusLabel,
        'Cobrado',
      ),
      paymentMethod: getString(
        payment?.method ?? data.paymentMethod,
        'cash_on_delivery',
      ),
      courierId,
      courierName: courier.name,
      courierEmail: courier.email,
      customerName: getString(
        data.customerName ?? data.buyerName,
        'Cliente no registrado',
      ),
      deliveryId: deliveryDoc?.id ?? null,
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
    confirmedByBuyerCount: collectedOrders.filter(
      (order) => order.buyerReceptionConfirmed,
    ).length,
    orders: collectedOrders,
  });
};

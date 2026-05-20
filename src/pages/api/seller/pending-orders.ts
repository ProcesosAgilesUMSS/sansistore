import type { APIRoute } from 'astro';
import { adminDb } from '../../../lib/firebase-admin';
import { adminAuth } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface PendingOrderProduct {
  nombre: string;
  productId?: string;
  unitPrice?: number;
  quantity?: number;
  subtotal?: number;
}

interface PendingOrderResponse {
  id_pedido: string;
  productos: PendingOrderProduct[];
  fecha: string;
  estado: 'pendiente';
}

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

function toISODate(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString().split('T')[0];
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') return value.split('T')[0];
  return new Date().toISOString().split('T')[0];
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

export const GET: APIRoute = async ({ request }) => {
  const sellerUid = await resolveSellerUid(request);

  if (!sellerUid) {
    return jsonResponse(
      { error: 'Acceso denegado. Se requiere autenticación con rol de vendedor.' },
      403,
    );
  }

  const snapshot = await adminDb
    .collection('orders')
    .where('sellerId', '==', sellerUid)
    .where('status', '==', 'CREADO')
    .orderBy('createdAt', 'asc')
    .get();

  const pedidos: PendingOrderResponse[] = await Promise.all(
    snapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data();

      const itemsSnap = await adminDb
        .collection('orders')
        .doc(orderDoc.id)
        .collection('orderItems')
        .get();

      const productos: PendingOrderProduct[] = itemsSnap.docs.map((item) => {
        const d = item.data();
        return {
          nombre: d.productName ?? 'Producto sin nombre',
          productId: d.productId ?? undefined,
          unitPrice: d.unitPrice ?? undefined,
          quantity: d.quantity ?? undefined,
          subtotal: d.subtotal ?? undefined,
        };
      });

      return {
        id_pedido: orderDoc.id,
        productos,
        fecha: toISODate(data.createdAt),
        estado: 'pendiente' as const,
      };
    }),
  );

  return jsonResponse({ pedidos, total: pedidos.length });
};

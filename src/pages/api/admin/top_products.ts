import type { APIRoute } from 'astro';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

interface TopProduct {
  productId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  offerPrice?: number;
  hasOffer: boolean;
  imageUrl?: string;
  soldCount: number;
}

interface TopProductsResponse {
  products: TopProduct[];
  total: number;
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

const devBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';
const devAdminUid = import.meta.env.DEV_ADMIN_UID || 'dev-admin';

async function resolveAdminUid(request: Request): Promise<string | null> {
  if (devBypassEnabled) return devAdminUid;

  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const roles: string[] = userDoc.data()?.roles ?? [];
    if (!roles.includes('admin')) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const adminUid = await resolveAdminUid(request);

  if (!adminUid) {
    return jsonResponse(
      { error: 'Acceso denegado. Se requiere autenticación con rol de administrador.' },
      403,
    );
  }

  // Parámetros opcionales
  const limitParam = url.searchParams.get('limit');
  const categoryId = url.searchParams.get('categoryId');
  const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 10;

  try {
    // Consultar productos ordenados por soldCount descendente
    let productsQuery = adminDb
      .collection('products')
      .where('active', '==', true)
      .orderBy('soldCount', 'desc')
      .limit(limit);

    // Filtrar por categoría si se especifica
    if (categoryId) {
      productsQuery = adminDb
        .collection('products')
        .where('active', '==', true)
        .where('categoryId', '==', categoryId)
        .orderBy('soldCount', 'desc')
        .limit(limit);
    }

    const productsSnap = await productsQuery.get();

    // Obtener todas las categorías para resolver nombres
    const categoriesSnap = await adminDb.collection('categories').get();
    const categoriesMap: Record<string, string> = {};
    categoriesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = data.categoryId ?? doc.id;
      categoriesMap[key] = data.name ?? 'Sin categoría';
    });

    const products: TopProduct[] = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        productId: doc.id,
        name: data.name ?? 'Producto sin nombre',
        categoryId: data.categoryId ?? '',
        categoryName: categoriesMap[data.categoryId] ?? 'Sin categoría',
        price: data.price ?? 0,
        offerPrice: data.offerPrice ?? undefined,
        hasOffer: data.hasOffer ?? false,
        imageUrl: data.imageUrl ?? undefined,
        soldCount: data.soldCount ?? 0,
      };
    });

    return jsonResponse({ products, total: products.length } as TopProductsResponse);

  } catch (error) {
    console.error('GET /api/admin/top-products error:', error);
    return jsonResponse(
      { error: 'No se pudieron obtener los productos más vendidos.' },
      500,
    );
  }
};
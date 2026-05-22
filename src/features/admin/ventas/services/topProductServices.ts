import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';

export interface TopProduct {
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

export interface TopProductsResponse {
  products: TopProduct[];
  total: number;
}

export interface TopProductsParams {
  limit?: number;
  categoryId?: string;
}

async function getAuthorizationHeader(): Promise<Record<string, string>> {
  const currentUser =
    auth.currentUser ??
    (await new Promise<FirebaseUser | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    }));

  const token = await currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseApiError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.error ?? 'Ocurrió un error al procesar la solicitud.';
}

export async function getTopProducts(
  params: TopProductsParams = {}
): Promise<TopProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);

  const url = `/api/admin/top_products${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url, {
    headers: await getAuthorizationHeader(),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<TopProductsResponse>;
}
import { auth } from '../../../lib/firebase';

export interface DailyCollectionsSummary {
  date: string;
  totalCollected: number;
  orderCount: number;
  confirmedByBuyerCount: number;
  orders: Array<{
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
  }>;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchDailyCollections(
  date?: string,
): Promise<DailyCollectionsSummary> {
  const headers = await getAuthHeader();
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`/api/seller/daily-collections${query}`, {
    headers,
  });

  if (response.status === 403) {
    throw new Error('Acceso denegado. Se requiere rol de vendedor.');
  }

  if (!response.ok) {
    throw new Error('No se pudo obtener el total cobrado del dia.');
  }

  return response.json() as Promise<DailyCollectionsSummary>;
}

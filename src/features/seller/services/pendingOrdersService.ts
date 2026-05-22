import { auth } from '../../../lib/firebase';
import type { PendingOrder, PendingOrdersResponse } from '../types/pendingOrders';

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPendingOrders(): Promise<PendingOrder[]> {
  const headers = await getAuthHeader();

  const response = await fetch('/api/seller/pending-orders', { headers });

  if (response.status === 403) {
    throw new Error('Acceso denegado. Se requiere rol de vendedor.');
  }

  if (!response.ok) {
    throw new Error('Error al obtener los pedidos pendientes.');
  }

  const data: PendingOrdersResponse = await response.json();
  return data.pedidos;
}

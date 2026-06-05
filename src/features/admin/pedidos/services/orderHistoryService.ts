// src/features/admin/pedidos/services/orderHistoryService.ts

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import type { OrderHistory } from '../types';

async function getAuthorizationHeader(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        const token = await user.getIdToken();
        resolve({ Authorization: `Bearer ${token}` });
      } else {
        resolve({});
      }
    });
  });
}

export async function getOrderHistory(orderId: string): Promise<OrderHistory> {
  const headers = await getAuthorizationHeader();

  const response = await fetch(
    `/api/admin/order_history?orderId=${encodeURIComponent(orderId)}`,
    { headers }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Error ${response.status}`);
  }

  return response.json() as Promise<OrderHistory>;
}
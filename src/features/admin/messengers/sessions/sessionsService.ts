// src/features/admin/messengers/sessions/sessionsService.ts

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import type {
  ShiftClosuresListResponse,
  ValidateShiftClosurePayload,
  ValidateShiftClosureResponse,
} from './types';

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

interface GetClosuresParams {
  limit?: number;
  cursor?: string | null;
}

export async function getPendingClosures(
  params: GetClosuresParams = {}
): Promise<ShiftClosuresListResponse> {
  const headers = await getAuthorizationHeader();
  const query = new URLSearchParams({
    status: 'closed',
    limit: String(params.limit ?? 20),
  });
  if (params.cursor) query.set('cursor', params.cursor);

  const response = await fetch(`/api/admin/courier_sessions?${query}`, { headers });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `Error ${response.status}`);
  }

  return response.json() as Promise<ShiftClosuresListResponse>;
}

export async function validateShiftClosure(
  payload: ValidateShiftClosurePayload
): Promise<ValidateShiftClosureResponse> {
  const headers = await getAuthorizationHeader();

  const response = await fetch('/api/admin/courier_sessions', {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `Error ${response.status}`);
  }

  return response.json() as Promise<ValidateShiftClosureResponse>;
}
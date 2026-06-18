// src/features/admin/messengers/sessions/sessionsService.ts

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import type {
  CourierSessionsListResponse,
  ValidateCourierSessionPayload,
  ValidateCourierSessionResponse,
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

interface GetSessionsParams {
  limit?: number;
  cursor?: string | null;
}

export async function getPendingSessions(
  params: GetSessionsParams = {}
): Promise<CourierSessionsListResponse> {
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

  return response.json() as Promise<CourierSessionsListResponse>;
}

export async function validateCourierSession(
  payload: ValidateCourierSessionPayload
): Promise<ValidateCourierSessionResponse> {
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

  return response.json() as Promise<ValidateCourierSessionResponse>;
}
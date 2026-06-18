// src/features/admin/messengers/sessions/types.ts

export type CourierSessionStatus = 'open' | 'closed' | 'validated' | 'rejected';

export interface CourierSession {
  sessionId: string;
  courierId: string;
  courierName: string;
  totalCollected: number;
  deliveriesCount: number;
  expectedAmount: number;
  differenceAmount: number;
  status: CourierSessionStatus;
  openedAt: string;
  closedAt: string | null;
  validatedBy?: string | null;
  validatedByName?: string | null;
  validatedAt?: string | null;
  rejectionReason?: string | null;
  updatedAt: string;
}

export interface CourierSessionsListResponse {
  sessions: CourierSession[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type CourierSessionAction = 'approve' | 'reject';

export interface ValidateCourierSessionPayload {
  sessionId: string;
  action: CourierSessionAction;
  rejectionReason?: string;
}

export interface ValidateCourierSessionResponse {
  message: string;
  session: CourierSession;
}
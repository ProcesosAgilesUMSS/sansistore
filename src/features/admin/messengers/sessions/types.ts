// src/features/admin/messengers/sessions/types.ts

export interface ShiftOrderSnapshot {
  id: string;
  deliveryId: string;
  customerName: string;
  buyerName: string;
  phone: string;
  address: string;
  city: string;
  deliveryStatus: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  cashToCollect: number;
  paymentCollectedAt: string | null;
  assignedAt: string | null;
  updatedAt: string | null;
}

export interface ShiftSummary {
  completedCount: number;
  pendingCount: number;
  notDeliveredCount: number;
  cancelledCount: number;
  totalCollected: number;
}

// Status del cierre — "closed" viene del mensajero,
// "validated" y "rejected" los agrega esta HU al validar
export type ShiftClosureStatus = 'closed' | 'validated' | 'rejected';

export interface ShiftClosure {
  // ID del documento: "{courierId}_{dateKey}" ej: "user-luis_2026-05-15"
  id: string;
  courierId: string;
  courierName: string;
  dateKey: string;            // "YYYY-MM-DD"
  status: ShiftClosureStatus;
  startedAt: string | null;
  closedAt: string | null;
  createdAt: string | null;
  summary: ShiftSummary;
  completedOrders: ShiftOrderSnapshot[];
  pendingOrders: ShiftOrderSnapshot[];
  incidentOrders: ShiftOrderSnapshot[];
  // Campos que agrega el admin al validar (no existen en el doc original)
  validatedBy: string | null;
  validatedByName: string | null;
  validatedAt: string | null;
  rejectionReason: string | null;
}

export interface ShiftClosuresListResponse {
  closures: ShiftClosure[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type ShiftClosureAction = 'approve' | 'reject';

export interface ValidateShiftClosurePayload {
  closureId: string;
  action: ShiftClosureAction;
  rejectionReason?: string;
}

export interface ValidateShiftClosureResponse {
  message: string;
  closure: ShiftClosure;
}
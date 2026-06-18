export type ReconciliationIssueType =
  | 'missing-payment'
  | 'pending-payment'
  | 'amount-mismatch';

export interface PaymentReconciliationItem {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  paymentAmount: number | null;
  difference: number;
  orderStatus: string;
  deliveryStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveredAt: Date | null;
  updatedAt: Date | null;
  issueType: ReconciliationIssueType;
}

export type ReconciliationFilter = ReconciliationIssueType | 'all';

export const RECONCILIATION_ISSUE_LABELS: Record<ReconciliationIssueType, string> = {
  'missing-payment': 'Sin pago registrado',
  'pending-payment': 'Pago no cobrado',
  'amount-mismatch': 'Monto diferente',
};

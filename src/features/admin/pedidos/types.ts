export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderPayment {
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  registeredBy: string;
  verifiedBy?: string | null;
  registeredAt?: string | null;
  verifiedAt?: string | null;
}

export interface OrderDelivery {
  deliveryId: string;
  orderId: string;
  courierId: string;
  courierName?: string | null;
  status: string;
  deliveryCode?: string | null;
  attemptNumber?: number | null;
  incidentReason?: string | null;
  evidenceUrl?: string | null;
  failureReason?: string | null;
  amountCollected: number;
  customerConfirmed?: boolean;
  customerConfirmedAt?: string | null;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  inTransitAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  reprogrammedAt?: string | null;
}

export interface TimelineEvent {
  label: string;
  detail?: string;
  timestamp: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

export interface OrderHistory {
  orderId: string;
  buyerName: string;
  sellerName: string;
  customerName?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  total: number;
  status: string;
  paymentStatus?: string | null;
  deliveryStatus?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  incidentReason?: string | null;
  items: OrderItem[];
  payment?: OrderPayment | null;
  delivery?: OrderDelivery | null;
  timeline: TimelineEvent[];
}

export interface OrderSummary {
  orderId: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus?: string | null;
  deliveryStatus?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  incidentReason?: string | null;
}

export interface OrdersListResponse {
  orders: OrderSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}
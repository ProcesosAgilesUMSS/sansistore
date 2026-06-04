// src/features/admin/pedidos/types.ts

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
  verifiedBy?: string;
  registeredAt?: string;
  verifiedAt?: string;
}

export interface OrderDelivery {
  deliveryId: string;
  orderId: string;
  courierId: string;
  courierName?: string;
  status: string;
  deliveryCode?: string;
  attemptNumber?: number;
  incidentReason?: string;
  evidenceUrl?: string;
  failureReason?: string;
  amountCollected: number;
  customerConfirmed?: boolean;
  customerConfirmedAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  reprogrammedAt?: string;
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
  customerName?: string;
  customerPhone?: string;
  address?: string;
  total: number;
  status: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  incidentReason?: string;
  items: OrderItem[];
  payment?: OrderPayment;
  delivery?: OrderDelivery;
  timeline: TimelineEvent[];
}
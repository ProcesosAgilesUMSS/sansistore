export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

export const AVAILABLE_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export type FirestoreDateLike = {
  toDate: () => Date;
};

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  price?: number;
  unitPrice?: number;
  quantity: number;
  subtotal: number;
  description?: string;
}

export interface Order {
  id: string;
  buyerId?: string;
  deliveryId?: string | null;
  status: OrderStatus;
  delivery: {
    destination: string;
  };
  total: number;
  items: OrderItem[];
  createdAt?: FirestoreDateLike;
  customerConfirmed?: boolean;
  customerConfirmedAt?: Date | null;
}

export type ReturnStatus = 'pending_review' | 'approved' | 'rejected';

export interface ReturnRequest {
  id?: string;
  orderId: string;
  buyerId?: string;
  productId: string;
  productName: string;
  reason: string;
  status: ReturnStatus;
  createdAt: FirestoreDateLike;
}

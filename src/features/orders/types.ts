export type OrderStatus = 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled' | 'CREADO' | 'RESERVADO' | 'PENDIENTE' | 'EMPAQUETADO';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
  CREADO: "creado",
  RESERVADO: "reservado",
  PENDIENTE: "pendiente",
  EMPAQUETADO: "empaquetado"
};

export const AVAILABLE_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  description?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId?: string;
  status: OrderStatus;
  buyerReceptionConfirmed?: boolean;
  buyerReceptionConfirmedAt?: FirestoreDateLike;
  delivery: {
    destination: string;
  };
  total?: number;
  items: OrderItem[];
  createdAt: Date | any;
}

export type ReturnStatus = 'pending_review' | 'approved' | 'rejected';

export interface ReturnRequest {
  id?: string;
  orderId: string;
  buyerId: string;
  productId: string;
  productName: string;
  reason: string;
  status: ReturnStatus;
  createdAt: any;
}

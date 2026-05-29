import { Timestamp } from "firebase/firestore";

export type OrderStatus =
  'CREADO' |
  'ASIGNADO' |
  'EN CAMINO' |
  'ENTREGADO' |
  'PAGADO' |
  'CANCELADO' |
  'NO ENTREGADO' |
  'RESERVADO' |
  'PENDIENTE' |
  'EMPAQUETADO' |
  'LISTO';

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  description?: string;
}

export interface Order {
  id: string;
  secret?: string;
  buyerId: string;
  sellerId?: string;
  status: OrderStatus;
  buyerReceptionConfirmed?: boolean;
  buyerReceptionConfirmedAt: Timestamp | null;
  delivery: {
    destination: string;
  };
  total?: number;
  items: OrderItem[];
  createdAt: Timestamp;
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
  createdAt: Timestamp;
}

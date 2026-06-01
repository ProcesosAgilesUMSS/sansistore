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

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREADO: "CREADO",
  ASIGNADO: "ASIGNADO",
  'EN CAMINO': "EN CAMINO",
  ENTREGADO: "ENTREGADO",
  PAGADO: "PAGADO",
  CANCELADO: "CANCELADO",
  'NO ENTREGADO': "NO ENTREGADO",
  RESERVADO: "RESERVADO",
  PENDIENTE: "PENDIENTE",
  EMPAQUETADO: "EMPAQUETADO",
  LISTO: "LISTO"
};

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  description?: string;
  stockAvailable?: number;
}

export interface Order {
  id: string;
  secret?: string;
  buyerId: string;
  buyerName?: string;
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
  incidentReason?: string;
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

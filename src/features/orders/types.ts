import { Timestamp } from 'firebase/firestore';

export type OrderStatus =
  | 'CREADO'
  | 'ASIGNADO'
  | 'EN CAMINO'
  | 'ENTREGADO'
  | 'PAGADO'
  | 'CANCELADO'
  | 'NO ENTREGADO'
  | 'RESERVADO'
  | 'PENDIENTE'
  | 'EMPAQUETADO'
  | 'LISTO'
  | 'COMPLETADO';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREADO: 'CREADO',
  ASIGNADO: 'ASIGNADO',
  'EN CAMINO': 'EN CAMINO',
  ENTREGADO: 'ENTREGADO',
  PAGADO: 'PAGADO',
  CANCELADO: 'CANCELADO',
  'NO ENTREGADO': 'NO ENTREGADO',
  RESERVADO: 'RESERVADO',
  PENDIENTE: 'PENDIENTE',
  EMPAQUETADO: 'EMPAQUETADO',
  LISTO: 'LISTO',
  COMPLETADO: 'COMPLETADO',
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
  imageUrl?: string;
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
  deliveryStatus?: string | null;
  deliveryId?: string | null;
  courierId?: string | null;
  collectedBy?: string | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
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

export interface DeliveryReview {
  id?: string;
  orderId: string;
  courierId: string | null;
  buyerId: string;
  buyerName?: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp | null;
}

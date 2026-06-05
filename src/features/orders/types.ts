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
  'LISTO' |
  'ACEPTADO' |
  'PENDIENTE REASIGNACION' |
  'DEVUELTO';


export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREADO: "CREADO",
  RESERVADO: "RESERVADO",
  PENDIENTE: "PENDIENTE",
  EMPAQUETADO: "EMPAQUETADO",
  LISTO: "LISTO",
  ASIGNADO: "ASIGNADO",
  ACEPTADO: "ACEPTADO",
  'PENDIENTE REASIGNACION': "RECHAZADO",
  DEVUELTO: "DEVUELTO",
  'EN CAMINO': "EN CAMINO",
  ENTREGADO: "ENTREGADO",
  PAGADO: "PAGADO",
  CANCELADO: "CANCELADO",
  'NO ENTREGADO': "NO ENTREGADO",
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

export interface Delivery {
  id: string;
  orderId: string;
  courierId?: string;
  courierName?: string;
  status: string;
  deliveryCode?: string;
  attemptNumber?: number;
  incidentReason?: string | null;
  incidentNotes?: string | null;
  evidenceUrl?: string;
  failureReason?: string;
  amountCollected?: number;
  customerConfirmed?: boolean;
  customerConfirmedAt?: Timestamp | null;
  assignedAt?: Timestamp | null;
  pickedUpAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  inTransitAt?: Timestamp | null;
  failedAt?: Timestamp | null;
  reprogrammedAt?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  address: string;
  deliveryStatus?: string | null;
  delivery?: Delivery | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  total?: number;
  items: OrderItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  incidentReason?: string;
  incidentNotes?: string;
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

export type OrderStatus =
  | "CREADO"
  | "PENDIENTE"
  | "RESERVADO"
  | "EMPAQUETADO"
  | "EN CAMINO"
  | "ENTREGADO"
  | "PAGADO"
  | "NO ENTREGADO"
  | "CANCELADO";

export type DeliveryStatus =
  | "DELIVERED"
  | "IN TRANSIT"
  | "NOT_DELIVERED"
  | "CANCELLED"
  | null;

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface AdminOrder {
  // Campos de solo lectura (no se editan desde el panel)
  id: string;
  secret: string;
  buyerId: string;
  sellerId: string | null;
  locationId: string;
  paymentId: string | null;
  deliveryId: string | null;

  // Campos editables
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  incidentReason?: string;
  total: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | "TODOS";
}

export interface UpdateOrderPayload {
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  incidentReason?: string;
  total: number;
}
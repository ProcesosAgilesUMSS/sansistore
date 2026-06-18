export type OrderStatus =
  | 'CREADO'
  | 'RESERVADO'
  | 'PENDIENTE'
  | 'EMPAQUETADO'
  | 'LISTO'
  | 'ASIGNADO'
  | 'EN CAMINO'
  | 'ENTREGADO'
  | 'PAGADO'
  | 'CANCELADO'
  | 'NO ENTREGADO';

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  orderId: string;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerInstitutionalId?: string;
  sellerId: string;
  status: OrderStatus;
  total: number;
  locationId: string;
  locationLabel?: string;
  locationType?: string;
  paymentStatus: string;
  paymentId?: string | null;
  paymentMethod?: string | null;
  paymentAmount?: number | null;
  deliveryStatus: string | null;
  deliveryId: string | null;
  deliveryCode?: string | null;
  deliveryCourierName?: string | null;
  deliveryCourierInstitutionalId?: string | null;
  incidentReason: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}


export type OrderDoc = {
  orderId: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  total: number;
  locationId: string;
  paymentId: string | null;
  paymentStatus: string;
  deliveryId: string | null;
  deliveryCode: string | null;
  deliveryStatus: string | null;
  incidentReason: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItemDoc = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export interface Messenger {
	uid: string;
	displayName: string;
	institutionalId: string;
	isAvailable: boolean;
}

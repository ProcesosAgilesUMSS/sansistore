export interface PendingOrderProduct {
  nombre: string;
  productId?: string;
  unitPrice?: number;
  quantity?: number;
  subtotal?: number;
}

export interface PendingOrder {
  id_pedido: string;
  productos: PendingOrderProduct[];
  fecha: string;
  estado: 'pendiente';
}

export interface PendingOrdersResponse {
  pedidos: PendingOrder[];
  total: number;
}

export interface DeliveryData {
  deliveryCode: string | null;
  deliveryCourierName: string | null;
  deliveryCourierInstitutionalId: string | null;
  courierId: string | null;
}

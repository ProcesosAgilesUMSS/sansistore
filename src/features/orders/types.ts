export type OrderStatus = 'in_transit' | 'delivered' | 'CREADO' | 'RESERVADO' | 'PENDIENTE' | 'EMPAQUETADO';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  in_transit: "en camino",
  delivered: "entregado",
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
  status: OrderStatus;
  delivery: {
    destination: string;
  };
  total?: number;
  items: OrderItem[];
}

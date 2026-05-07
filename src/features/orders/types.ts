export type OrderStatus = 'in_transit' | 'delivered';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  in_transit: "en camino",
  delivered: "entregado"
};

export const AVAILABLE_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export interface Order {
  id: string;
  status: OrderStatus;
  delivery: {
    destination: string;
  };
}

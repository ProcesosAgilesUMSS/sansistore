export type OrderStatus = 'en camino' | 'entregado';

export interface Order {
  id: string;
  status: OrderStatus;
  delivery: {
    destination: string;
  };
}

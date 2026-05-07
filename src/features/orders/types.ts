export type OrderStatus = 'en camino' | 'entregado';

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
  status: OrderStatus;
  delivery: {
    destination: string;
  };
  total?: number;
  items: OrderItem[];
}
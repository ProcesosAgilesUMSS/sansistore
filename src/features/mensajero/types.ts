export interface MessengerOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface MessengerOrder {
  id: string;
  deliveryId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  reference?: string;
  items: MessengerOrderItem[];
  cashToCollect: number;
  paymentMethod: 'cash' | 'cash_on_delivery';
  deliveryStatus: 'assigned' | 'in_transit' | 'delivered';
}

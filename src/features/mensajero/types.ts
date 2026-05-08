export interface MessengerOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface MessengerOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  reference?: string;
  items: MessengerOrderItem[];
  cashToCollect: number;
  paymentMethod: 'cash';
  deliveryStatus: 'pending' | 'in_transit' | 'delivered';
}
export interface CourierOrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CourierOrder {
  id: string;
  orderCode: string;
  buyerName: string;
  deliveryZone: string;
  productsTotal: number;
  additionalCharges: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod: string;
  deliveryMethod: string;
  specialInstructions: string;
  paymentId: string | null;
  createdAt: Date | null;
  deliveredAt: Date | null;
  items: CourierOrderItem[];
}

export interface CourierDashboardStats {
  pendingCount: number;
  deliveredTodayCount: number;
  pendingCashTotal: number;
}

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
  lat?: number | null;
  lng?: number | null;
  items: MessengerOrderItem[];
  cashToCollect: number;
  paymentMethod: 'cash' | 'cash_on_delivery';
  deliveryStatus:
    | 'assigned'
    | 'accepted'
    | 'pending_reassignment'
    | 'in_transit'
    | 'delivered'
    | 'not_delivered';
}

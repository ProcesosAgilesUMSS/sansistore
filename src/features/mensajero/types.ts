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
  paymentCollectedAt?: Date | null;  // NUEVO: Cuándo se registró el pago
  collectedBy?: string;               // NUEVO: ID del mensajero que cobró
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
  paymentId: string | null;
  orderCode: string;        
  customerName: string;
  buyerName: string;        
  phone: string;
  address: string;
  city: string;
  reference?: string;
  items: MessengerOrderItem[];
  cashToCollect: number;
  paymentMethod: 'cash_on_delivery';
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentCollectedAt: Date | null;
  collectedBy: string | null;
  deliveryMethod: string;   
  deliveryStatus: 'assigned' | 'accepted' | 'in_transit' | 'delivered' | 'not_delivered' | 'pending_reassignment';
  assignedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

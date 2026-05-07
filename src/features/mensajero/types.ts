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

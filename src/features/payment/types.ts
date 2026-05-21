export interface CobroProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
  quantity?: number;
}

export interface CashOnDeliveryOrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CashOnDeliveryOrderInput {
  items: CashOnDeliveryOrderItem[];
  productsTotal: number;
  additionalCharges: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  courierId?: string;
}

export interface CashOnDeliveryOrderResult {
  orderId: string;
  paymentId: string;
  deliveryId: string;
  orderCode: string;
  items: CashOnDeliveryOrderItem[];
  productsTotal: number;
  additionalCharges: number;
  total: number;
  paymentMethod: CashPaymentMethod;
  paymentMethodLabel: string;
  deliveryAddress: string;
  status: string;
  statusLabel: string;
}

export interface ConfirmedCashOrder {
  orderId: string;
  paymentId: string;
  deliveryId: string;
  orderCode: string;
  items: CashOnDeliveryOrderItem[];
  productsTotal: number;
  additionalCharges: number;
  total: number;
  paymentMethodLabel: string;
  deliveryAddress: string;
  statusLabel: string;
}

export type CashPaymentMethod = 'cash_on_delivery';

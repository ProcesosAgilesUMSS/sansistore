export interface CobroProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
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
}

export interface CashOnDeliveryOrderResult {
  orderId: string;
  paymentId: string;
}

export interface ConfirmedCashOrder {
  orderId: string;
  paymentId: string;
  total: number;
}

export type CashPaymentMethod = 'cash_on_delivery';

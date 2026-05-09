import type {
  CashOnDeliveryOrderInput,
  CashOnDeliveryOrderResult,
} from '../types';

const generateId = () => Math.random().toString(36).slice(2, 18).toUpperCase();

export const createCashOnDeliveryOrder = async (
  order: CashOnDeliveryOrderInput
): Promise<CashOnDeliveryOrderResult> => {
  if (order.items.length === 0 || order.total <= 0) {
    throw new Error('Order must contain at least one valid item.');
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const orderId = `ORD-${generateId()}`;
  const paymentId = `PAY-${generateId()}`;
  const deliveryId = `DEL-${generateId()}`;

  // Simulate occasional error (comment out to disable)
  // if (Math.random() < 0.1) throw new Error('Simulated network error');

  console.log('[MOCK] Order created:', {
    orderId,
    paymentId,
    deliveryId,
    ...order,
  });

  return { orderId, paymentId, deliveryId };
};
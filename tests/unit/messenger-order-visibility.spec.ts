import { expect, test, describe } from 'vitest';
import { getVisibleMessengerOrders } from '@features/mensajero/utils/orderVisibility';
import type { MessengerOrder } from '@features/mensajero/types';

const baseOrder: MessengerOrder = {
  id: 'order-001',
  deliveryId: 'delivery-001',
  paymentId: null,
  customerName: 'Cliente',
  buyerName: 'Cliente',
  phone: '70000000',
  address: 'Campus UMSS',
  city: 'Cochabamba',
  items: [],
  cashToCollect: 0,
  paymentMethod: 'cash_on_delivery',
  paymentStatus: 'PENDIENTE',
  paymentStatusLabel: 'Pendiente de cobro',
  paymentCollectedAt: null,
  collectedBy: null,
  deliveryMethod: 'Delivery',
  deliveryStatus: 'assigned',
  assignedAt: new Date('2026-04-25T10:00:00.000Z'),
  createdAt: new Date('2026-04-25T09:55:00.000Z'),
  updatedAt: new Date('2026-04-25T10:00:00.000Z'),
};

describe('messenger order visibility', () => {
  test('keeps an order in only its most advanced delivery state', () => {
    const assignedOrder: MessengerOrder = {
      ...baseOrder,
      deliveryId: 'delivery-005',
      deliveryStatus: 'assigned',
      cashToCollect: 29,
    };
    const inTransitOrder: MessengerOrder = {
      ...baseOrder,
      deliveryId: 'delivery-006',
      deliveryStatus: 'in_transit',
      cashToCollect: 206,
      updatedAt: new Date('2026-04-25T11:15:00.000Z'),
    };

    const visibleOrders = getVisibleMessengerOrders([
      assignedOrder,
      inTransitOrder,
    ]);

    expect(visibleOrders).toHaveLength(1);
    expect(visibleOrders[0].deliveryId).toBe('delivery-006');
    expect(visibleOrders[0].deliveryStatus).toBe('in_transit');
    expect(visibleOrders[0].cashToCollect).toBe(206);
  });
});

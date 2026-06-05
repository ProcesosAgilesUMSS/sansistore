import { expect, test } from '@playwright/test';
import type { MessengerOrder } from '../src/features/mensajero/types';
import {
  getCollectedOrdersForDay,
  getCollectedTotal,
  getCollectedTotalForDay,
  isMessengerOrderCollected,
} from '../src/features/mensajero/utils/collectionSummary';

const baseOrder: MessengerOrder = {
  id: 'order-base',
  deliveryId: 'delivery-base',
  paymentId: 'payment-base',
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
  deliveryStatus: 'accepted',
  assignedAt: null,
  createdAt: null,
  updatedAt: null,
};

function buildOrder(
  id: string,
  overrides: Partial<MessengerOrder>
): MessengerOrder {
  return {
    ...baseOrder,
    id,
    deliveryId: `delivery-${id}`,
    paymentId: `payment-${id}`,
    ...overrides,
  };
}

test.describe('messenger collection summary', () => {
  test('counts only delivered orders with collected payment status', () => {
    const collected = buildOrder('collected', {
      cashToCollect: 100,
      deliveryStatus: 'delivered',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      paymentCollectedAt: new Date('2026-06-04T12:00:00.000Z'),
    });
    const deliveredPendingPayment = buildOrder('pending-payment', {
      cashToCollect: 80,
      deliveryStatus: 'delivered',
      paymentStatus: 'PENDIENTE',
      paymentCollectedAt: new Date('2026-06-04T13:00:00.000Z'),
    });
    const collectedButNotDelivered = buildOrder('not-delivered', {
      cashToCollect: 60,
      deliveryStatus: 'in_transit',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      paymentCollectedAt: new Date('2026-06-04T14:00:00.000Z'),
    });

    expect(isMessengerOrderCollected(collected)).toBe(true);
    expect(isMessengerOrderCollected(deliveredPendingPayment)).toBe(false);
    expect(isMessengerOrderCollected(collectedButNotDelivered)).toBe(false);
    expect(
      getCollectedTotal([
        collected,
        deliveredPendingPayment,
        collectedButNotDelivered,
      ])
    ).toBe(100);
  });

  test('uses paymentCollectedAt to calculate the courier workday total', () => {
    const workday = new Date('2026-06-04T15:00:00.000Z');
    const today = buildOrder('today', {
      cashToCollect: 120,
      deliveryStatus: 'delivered',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      paymentCollectedAt: new Date('2026-06-04T09:00:00.000Z'),
      updatedAt: new Date('2026-06-03T23:00:00.000Z'),
    });
    const yesterday = buildOrder('yesterday', {
      cashToCollect: 90,
      deliveryStatus: 'delivered',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      paymentCollectedAt: new Date('2026-06-03T22:00:00.000Z'),
      updatedAt: new Date('2026-06-04T10:00:00.000Z'),
    });
    const noCollectedDate = buildOrder('no-date', {
      cashToCollect: 70,
      deliveryStatus: 'delivered',
      paymentStatus: 'COBRADO',
      paymentStatusLabel: 'Cobrado',
      paymentCollectedAt: null,
      updatedAt: new Date('2026-06-04T11:00:00.000Z'),
    });

    expect(getCollectedOrdersForDay([today, yesterday, noCollectedDate], workday))
      .toHaveLength(1);
    expect(getCollectedTotalForDay([today, yesterday, noCollectedDate], workday))
      .toBe(120);
  });
});

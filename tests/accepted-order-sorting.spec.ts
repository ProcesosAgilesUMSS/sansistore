import { expect, test } from '@playwright/test';
import {
  getMessengerOrderAgeTimestamp,
  sortAcceptedOrdersByAge,
} from '../src/features/mensajero/utils/acceptedOrderSorting';
import type { MessengerOrder } from '../src/features/mensajero/types';

const baseOrder: MessengerOrder = {
  id: 'order-base',
  deliveryId: 'delivery-base',
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
  deliveryStatus: 'accepted',
  assignedAt: null,
  createdAt: null,
  updatedAt: null,
};

function buildOrder(
  id: string,
  dates: Pick<MessengerOrder, 'assignedAt' | 'createdAt' | 'updatedAt'>
): MessengerOrder {
  return {
    ...baseOrder,
    id,
    deliveryId: `delivery-${id}`,
    ...dates,
  };
}

test.describe('accepted delivery sorting', () => {
  test('sorts accepted orders from oldest to newest by effective date', () => {
    const oldest = buildOrder('oldest', {
      assignedAt: new Date('2026-05-20T08:00:00.000Z'),
      createdAt: null,
      updatedAt: null,
    });
    const newest = buildOrder('newest', {
      assignedAt: new Date('2026-05-20T10:00:00.000Z'),
      createdAt: null,
      updatedAt: null,
    });

    const sorted = sortAcceptedOrdersByAge(
      [newest, oldest],
      'oldest-first'
    );

    expect(sorted.map((order) => order.id)).toEqual(['oldest', 'newest']);
  });

  test('sorts accepted orders from newest to oldest by effective date', () => {
    const oldest = buildOrder('oldest', {
      assignedAt: new Date('2026-05-20T08:00:00.000Z'),
      createdAt: null,
      updatedAt: null,
    });
    const newest = buildOrder('newest', {
      assignedAt: new Date('2026-05-20T10:00:00.000Z'),
      createdAt: null,
      updatedAt: null,
    });

    const sorted = sortAcceptedOrdersByAge(
      [oldest, newest],
      'newest-first'
    );

    expect(sorted.map((order) => order.id)).toEqual(['newest', 'oldest']);
  });

  test('uses createdAt and updatedAt as fallbacks and leaves undated orders last', () => {
    const assigned = buildOrder('assigned', {
      assignedAt: new Date('2026-05-20T09:00:00.000Z'),
      createdAt: new Date('2026-05-20T07:00:00.000Z'),
      updatedAt: null,
    });
    const created = buildOrder('created', {
      assignedAt: null,
      createdAt: new Date('2026-05-20T08:00:00.000Z'),
      updatedAt: null,
    });
    const updated = buildOrder('updated', {
      assignedAt: null,
      createdAt: null,
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    });
    const undated = buildOrder('undated', {
      assignedAt: null,
      createdAt: null,
      updatedAt: null,
    });

    expect(getMessengerOrderAgeTimestamp(assigned)).toBe(
      assigned.assignedAt?.getTime()
    );

    const sorted = sortAcceptedOrdersByAge(
      [undated, updated, assigned, created],
      'oldest-first'
    );

    expect(sorted.map((order) => order.id)).toEqual([
      'created',
      'assigned',
      'updated',
      'undated',
    ]);
  });
});

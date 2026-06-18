import { expect, test } from '@playwright/test';
import {
  ACTIVE_DELIVERY_STATUSES,
  countActiveDeliveriesByCourier,
  isActiveDeliveryStatus,
  isCourierAvailableFromActiveCount,
} from '../src/lib/deliveryAvailability';

test.describe('delivery availability rules', () => {
  test('marks only accepted and in transit deliveries as active', () => {
    expect(ACTIVE_DELIVERY_STATUSES).toEqual(['accepted', 'in_transit']);
    expect(isActiveDeliveryStatus('accepted')).toBe(true);
    expect(isActiveDeliveryStatus('in_transit')).toBe(true);
  });

  test('keeps closed or inactive delivery statuses from occupying a courier', () => {
    const inactiveStatuses = [
      'assigned',
      'delivered',
      'not_delivered',
      'pending_reassignment',
      'cancelled',
      'reprogrammed',
      '',
      null,
      undefined,
      'unknown',
    ];

    for (const status of inactiveStatuses) {
      expect(isActiveDeliveryStatus(status)).toBe(false);
    }
  });

  test('counts active deliveries by courier and ignores inactive deliveries', () => {
    const activeCounts = countActiveDeliveriesByCourier([
      { courierId: 'courier-1', status: 'accepted' },
      { courierId: 'courier-1', status: 'in_transit' },
      { courierId: 'courier-1', status: 'delivered' },
      { courierId: 'courier-2', status: 'not_delivered' },
      { courierId: 'courier-2', status: 'pending_reassignment' },
      { courierId: 'courier-3', status: 'cancelled' },
      { courierId: 'courier-4', status: 'accepted' },
      { courierId: '', status: 'accepted' },
      { courierId: null, status: 'accepted' },
    ]);

    expect(activeCounts).toEqual({
      'courier-1': 2,
      'courier-4': 1,
    });
  });

  test('keeps courier busy while at least one active delivery remains', () => {
    expect(isCourierAvailableFromActiveCount(0)).toBe(true);
    expect(isCourierAvailableFromActiveCount(1)).toBe(false);
    expect(isCourierAvailableFromActiveCount(2)).toBe(false);
  });
});

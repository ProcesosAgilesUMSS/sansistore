import { expect, test } from '@playwright/test';
import {
  assertCanTransitionDeliveryStatus,
  canTransitionDeliveryStatus,
  getAllowedNextDeliveryStatuses,
  getDeliveryStatusLabel,
  getOrderDeliveryStatusForDeliveryStatus,
  getOrderStatusForDeliveryStatus,
  type MessengerDeliveryStatus,
} from '../../src/features/mensajero/utils/deliveryStatusFlow';

const expectedMappings: Array<{
  status: MessengerDeliveryStatus;
  label: string;
  orderStatus: string;
  orderDeliveryStatus: string;
}> = [
  {
    status: 'assigned',
    label: 'Asignado',
    orderStatus: 'ASIGNADO',
    orderDeliveryStatus: 'ASSIGNED',
  },
  {
    status: 'accepted',
    label: 'Aceptado',
    orderStatus: 'ACEPTADO',
    orderDeliveryStatus: 'ACCEPTED',
  },
  {
    status: 'in_transit',
    label: 'En camino',
    orderStatus: 'EN CAMINO',
    orderDeliveryStatus: 'IN_TRANSIT',
  },
  {
    status: 'delivered',
    label: 'Entregado',
    orderStatus: 'ENTREGADO',
    orderDeliveryStatus: 'DELIVERED',
  },
  {
    status: 'not_delivered',
    label: 'No entregado',
    orderStatus: 'NO ENTREGADO',
    orderDeliveryStatus: 'NOT_DELIVERED',
  },
  {
    status: 'pending_reassignment',
    label: 'Pendiente de reasignacion',
    orderStatus: 'PENDIENTE-ASIGNACION',
    orderDeliveryStatus: 'PENDING_REASSIGNMENT',
  },
  {
    status: 'cancelled',
    label: 'Cancelado',
    orderStatus: 'CANCELADO',
    orderDeliveryStatus: 'CANCELLED',
  },
];

test.describe('delivery status flow', () => {
  test('maps messenger delivery statuses to visible labels and order statuses', () => {
    for (const mapping of expectedMappings) {
      expect(getDeliveryStatusLabel(mapping.status)).toBe(mapping.label);
      expect(getOrderStatusForDeliveryStatus(mapping.status)).toBe(
        mapping.orderStatus
      );
      expect(getOrderDeliveryStatusForDeliveryStatus(mapping.status)).toBe(
        mapping.orderDeliveryStatus
      );
    }
  });

  test('allows only courier workflow transitions', () => {
    expect(getAllowedNextDeliveryStatuses('assigned')).toEqual([
      'accepted',
      'pending_reassignment',
    ]);
    expect(getAllowedNextDeliveryStatuses('accepted')).toEqual([
      'in_transit',
      'not_delivered',
    ]);
    expect(getAllowedNextDeliveryStatuses('in_transit')).toEqual([
      'delivered',
      'not_delivered',
      'cancelled',
    ]);
    expect(getAllowedNextDeliveryStatuses('delivered')).toEqual([]);
  });

  test('detects invalid status transitions', () => {
    expect(canTransitionDeliveryStatus('assigned', 'accepted')).toBe(true);
    expect(canTransitionDeliveryStatus('accepted', 'in_transit')).toBe(true);
    expect(canTransitionDeliveryStatus('in_transit', 'delivered')).toBe(true);
    expect(canTransitionDeliveryStatus('assigned', 'delivered')).toBe(false);
    expect(canTransitionDeliveryStatus('delivered', 'in_transit')).toBe(false);

    expect(() =>
      assertCanTransitionDeliveryStatus('assigned', 'delivered')
    ).toThrow('Transicion de estado no permitida');
  });

  test('covers principal and alternative courier status routes', () => {
    const principalRoute: MessengerDeliveryStatus[] = [
      'assigned',
      'accepted',
      'in_transit',
      'delivered',
    ];

    for (let index = 0; index < principalRoute.length - 1; index += 1) {
      expect(
        canTransitionDeliveryStatus(
          principalRoute[index],
          principalRoute[index + 1]
        )
      ).toBe(true);
    }

    expect(canTransitionDeliveryStatus('assigned', 'pending_reassignment')).toBe(
      true
    );
    expect(canTransitionDeliveryStatus('accepted', 'not_delivered')).toBe(true);
    expect(canTransitionDeliveryStatus('in_transit', 'not_delivered')).toBe(true);
    expect(canTransitionDeliveryStatus('in_transit', 'cancelled')).toBe(true);
  });

  test('keeps not delivered persistence mappings aligned with order status fields', () => {
    expect(getOrderStatusForDeliveryStatus('not_delivered')).toBe(
      'NO ENTREGADO'
    );
    expect(getOrderDeliveryStatusForDeliveryStatus('not_delivered')).toBe(
      'NOT_DELIVERED'
    );
  });
});

import { expect, test } from '@playwright/test';
import {
  ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE,
  canAcceptAssignedOrder,
  hasActiveMessengerDelivery,
  isActiveDelivery,
} from '../src/features/mensajero/utils/acceptEligibility';
import type { MessengerOrder } from '../src/features/mensajero/types';

type DeliveryStatus = MessengerOrder['deliveryStatus'];

const orderWith = (deliveryStatus: DeliveryStatus) => ({ deliveryStatus });

test.describe('messenger accept eligibility', () => {
  test('treats only accepted and in_transit as active deliveries', () => {
    expect(isActiveDelivery(orderWith('accepted'))).toBe(true);
    expect(isActiveDelivery(orderWith('in_transit'))).toBe(true);

    expect(isActiveDelivery(orderWith('assigned'))).toBe(false);
    expect(isActiveDelivery(orderWith('delivered'))).toBe(false);
    expect(isActiveDelivery(orderWith('not_delivered'))).toBe(false);
    expect(isActiveDelivery(orderWith('cancelled'))).toBe(false);
    expect(isActiveDelivery(orderWith('pending_reassignment'))).toBe(false);
    expect(isActiveDelivery(orderWith('reprogrammed'))).toBe(false);
  });

  test('allows accepting when there are no active deliveries', () => {
    const orders = [orderWith('assigned'), orderWith('assigned')];

    expect(hasActiveMessengerDelivery(orders)).toBe(false);
    expect(canAcceptAssignedOrder(orders)).toBe(true);
  });

  test('blocks accepting a second order while one is accepted', () => {
    const orders = [orderWith('accepted'), orderWith('assigned')];

    expect(hasActiveMessengerDelivery(orders)).toBe(true);
    expect(canAcceptAssignedOrder(orders)).toBe(false);
  });

  test('blocks accepting a second order while one is in transit', () => {
    const orders = [orderWith('in_transit'), orderWith('assigned')];

    expect(hasActiveMessengerDelivery(orders)).toBe(true);
    expect(canAcceptAssignedOrder(orders)).toBe(false);
  });

  test('assigned orders never block accepting another order', () => {
    const orders = [orderWith('assigned'), orderWith('assigned')];

    // Tener pedidos asignados (incluso varios) no impide aceptar.
    expect(canAcceptAssignedOrder(orders)).toBe(true);
  });

  test('exposes a human readable reason for the block', () => {
    expect(ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE).toContain(
      'entrega activa'
    );
  });
});

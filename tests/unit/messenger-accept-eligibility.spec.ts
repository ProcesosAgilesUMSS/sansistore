import { expect, test, describe } from 'vitest';
import {
  ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE,
  canAcceptAssignedOrder,
  hasActiveMessengerDelivery,
  isActiveDelivery,
} from '../../src/features/mensajero/utils/acceptEligibility';
import type { MessengerOrder } from '../../src/features/mensajero/types';

type DeliveryStatus = MessengerOrder['deliveryStatus'];

const order = (deliveryStatus: DeliveryStatus): Pick<MessengerOrder, 'deliveryStatus'> => ({
  deliveryStatus,
});

describe('messenger accept eligibility', () => {
  test('solo accepted e in_transit cuentan como entrega activa', () => {
    expect(isActiveDelivery(order('accepted'))).toBe(true);
    expect(isActiveDelivery(order('in_transit'))).toBe(true);

    const inactive: DeliveryStatus[] = [
      'assigned',
      'delivered',
      'not_delivered',
      'cancelled',
      'reprogrammed',
      'pending_reassignment',
    ];
    for (const status of inactive) {
      expect(isActiveDelivery(order(status))).toBe(false);
    }
  });

  test('hasActiveMessengerDelivery detecta al menos una entrega activa', () => {
    expect(hasActiveMessengerDelivery([])).toBe(false);
    expect(
      hasActiveMessengerDelivery([order('assigned'), order('delivered')])
    ).toBe(false);
    expect(
      hasActiveMessengerDelivery([order('assigned'), order('accepted')])
    ).toBe(true);
    expect(
      hasActiveMessengerDelivery([order('in_transit')])
    ).toBe(true);
  });

  test('canAcceptAssignedOrder solo permite aceptar sin entrega activa', () => {
    // Sin entrega activa: puede aceptar.
    expect(canAcceptAssignedOrder([order('assigned')])).toBe(true);
    expect(canAcceptAssignedOrder([order('delivered'), order('not_delivered')])).toBe(true);
    expect(canAcceptAssignedOrder([])).toBe(true);

    // Con una entrega aceptada o en camino: queda bloqueado.
    expect(canAcceptAssignedOrder([order('accepted'), order('assigned')])).toBe(false);
    expect(canAcceptAssignedOrder([order('in_transit')])).toBe(false);
  });

  test('el mensaje de bloqueo esta bien codificado (UTF-8)', () => {
    // Protege contra el typo de encoding "TermÃ­nala": el acento debe ser "í".
    expect(ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE).toContain('Termínala');
    expect(ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE).not.toContain('Ã');
  });
});

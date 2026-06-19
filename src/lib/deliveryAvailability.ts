export const ACTIVE_DELIVERY_STATUSES = ['accepted', 'in_transit'] as const;

export type ActiveDeliveryStatus = (typeof ACTIVE_DELIVERY_STATUSES)[number];

export interface DeliveryAvailabilityInput {
  courierId?: unknown;
  status?: unknown;
}

export function isActiveDeliveryStatus(
  status: unknown
): status is ActiveDeliveryStatus {
  return ACTIVE_DELIVERY_STATUSES.includes(status as ActiveDeliveryStatus);
}

export function countActiveDeliveriesByCourier(
  deliveries: DeliveryAvailabilityInput[]
): Record<string, number> {
  return deliveries.reduce<Record<string, number>>((counts, delivery) => {
    if (
      typeof delivery.courierId !== 'string' ||
      !delivery.courierId ||
      !isActiveDeliveryStatus(delivery.status)
    ) {
      return counts;
    }

    counts[delivery.courierId] = (counts[delivery.courierId] ?? 0) + 1;
    return counts;
  }, {});
}

export function isCourierAvailableFromActiveCount(count: number) {
  return count <= 0;
}

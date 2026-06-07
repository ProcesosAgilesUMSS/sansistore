import type { MessengerOrder } from '../types';

const statusPriority: Record<MessengerOrder['deliveryStatus'], number> = {
  assigned: 1,
  accepted: 2,
  in_transit: 3,
  not_delivered: 4,
  pending_reassignment: 4,
  cancelled: 4,
  delivered: 5,
  reprogrammed: 1,
};

const getOrderActivityTime = (order: MessengerOrder) =>
  order.updatedAt?.getTime() ??
  order.assignedAt?.getTime() ??
  order.createdAt?.getTime() ??
  0;

const shouldReplaceOrder = (
  current: MessengerOrder,
  candidate: MessengerOrder
) => {
  const currentPriority = statusPriority[current.deliveryStatus];
  const candidatePriority = statusPriority[candidate.deliveryStatus];

  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority;
  }

  const currentTime = getOrderActivityTime(current);
  const candidateTime = getOrderActivityTime(candidate);

  if (candidateTime !== currentTime) {
    return candidateTime > currentTime;
  }

  return candidate.deliveryId.localeCompare(current.deliveryId) > 0;
};

export function getVisibleMessengerOrders(orders: MessengerOrder[]) {
  const visibleByOrderId = new Map<string, MessengerOrder>();

  for (const order of orders) {
    const current = visibleByOrderId.get(order.id);

    if (!current || shouldReplaceOrder(current, order)) {
      visibleByOrderId.set(order.id, order);
    }
  }

  return [...visibleByOrderId.values()].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
}

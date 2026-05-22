import type { MessengerOrder } from '../types';

export type AcceptedOrderSort = 'oldest-first' | 'newest-first';

export function getMessengerOrderAgeTimestamp(order: MessengerOrder) {
  return (
    order.assignedAt?.getTime() ??
    order.createdAt?.getTime() ??
    order.updatedAt?.getTime() ??
    null
  );
}

export function sortAcceptedOrdersByAge(
  orders: MessengerOrder[],
  sortOrder: AcceptedOrderSort
) {
  return [...orders].sort((left, right) => {
    const leftTimestamp = getMessengerOrderAgeTimestamp(left);
    const rightTimestamp = getMessengerOrderAgeTimestamp(right);

    if (leftTimestamp === null && rightTimestamp === null) {
      return left.id.localeCompare(right.id);
    }

    if (leftTimestamp === null) return 1;
    if (rightTimestamp === null) return -1;

    return sortOrder === 'oldest-first'
      ? leftTimestamp - rightTimestamp
      : rightTimestamp - leftTimestamp;
  });
}

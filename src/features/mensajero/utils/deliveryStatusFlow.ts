import type { MessengerOrder } from '../types';

export type MessengerDeliveryStatus = MessengerOrder['deliveryStatus'];

export const messengerDeliveryStatuses = [
  'assigned',
  'accepted',
  'in_transit',
  'delivered',
  'not_delivered',
  'pending_reassignment',
  'cancelled',
] as const satisfies MessengerDeliveryStatus[];

const deliveryStatusLabels: Record<MessengerDeliveryStatus, string> = {
  assigned: 'Asignado',
  accepted: 'Aceptado',
  in_transit: 'En camino',
  delivered: 'Entregado',
  not_delivered: 'No entregado',
  pending_reassignment: 'Pendiente de reasignacion',
  cancelled: 'Cancelado',
};

const orderStatusByDeliveryStatus: Record<MessengerDeliveryStatus, string> = {
  assigned: 'ASIGNADO',
  accepted: 'ACEPTADO',
  in_transit: 'EN CAMINO',
  delivered: 'ENTREGADO',
  not_delivered: 'NO ENTREGADO',
  pending_reassignment: 'PENDIENTE REASIGNACION',
  cancelled: 'CANCELADO',
};

const orderDeliveryStatusByDeliveryStatus: Record<MessengerDeliveryStatus, string> = {
  assigned: 'ASSIGNED',
  accepted: 'ACCEPTED',
  in_transit: 'IN_TRANSIT',
  delivered: 'DELIVERED',
  not_delivered: 'NOT_DELIVERED',
  pending_reassignment: 'PENDING_REASSIGNMENT',
  cancelled: 'CANCELLED',
};

const allowedTransitions: Record<MessengerDeliveryStatus, MessengerDeliveryStatus[]> = {
  assigned: ['accepted', 'pending_reassignment'],
  accepted: ['in_transit', 'not_delivered'],
  in_transit: ['delivered', 'not_delivered', 'cancelled'],
  delivered: [],
  not_delivered: [],
  pending_reassignment: [],
  cancelled: [],
};

export function getDeliveryStatusLabel(status: MessengerDeliveryStatus) {
  return deliveryStatusLabels[status];
}

export function getOrderStatusForDeliveryStatus(status: MessengerDeliveryStatus) {
  return orderStatusByDeliveryStatus[status];
}

export function getOrderDeliveryStatusForDeliveryStatus(
  status: MessengerDeliveryStatus
) {
  return orderDeliveryStatusByDeliveryStatus[status];
}

export function getAllowedNextDeliveryStatuses(status: MessengerDeliveryStatus) {
  return [...allowedTransitions[status]];
}

export function canTransitionDeliveryStatus(
  currentStatus: MessengerDeliveryStatus,
  nextStatus: MessengerDeliveryStatus
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function assertCanTransitionDeliveryStatus(
  currentStatus: MessengerDeliveryStatus,
  nextStatus: MessengerDeliveryStatus
) {
  if (currentStatus === nextStatus) return;

  if (!canTransitionDeliveryStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Transicion de estado no permitida: ${getDeliveryStatusLabel(
        currentStatus
      )} -> ${getDeliveryStatusLabel(nextStatus)}.`
    );
  }
}

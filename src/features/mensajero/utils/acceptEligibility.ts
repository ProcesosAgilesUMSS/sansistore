import type { MessengerOrder } from '../types';

type DeliveryStatus = MessengerOrder['deliveryStatus'];

/**
 * Estados que cuentan como una entrega activa del mensajero. Mientras exista
 * una entrega en alguno de estos estados, no se puede aceptar otro pedido.
 * `assigned` no bloquea: solo `accepted` y `in_transit`.
 */
const ACTIVE_DELIVERY_STATUSES: ReadonlyArray<DeliveryStatus> = [
    'accepted',
    'in_transit',
];

export const ACCEPT_BLOCKED_BY_ACTIVE_DELIVERY_MESSAGE =
    'Ya tienes una entrega activa (aceptada o en camino). Termínala antes de aceptar otro pedido.';

export function isActiveDelivery(
    order: Pick<MessengerOrder, 'deliveryStatus'>
): boolean {
    return ACTIVE_DELIVERY_STATUSES.includes(order.deliveryStatus);
}

/** Indica si el mensajero ya tiene al menos una entrega activa. */
export function hasActiveMessengerDelivery(
    orders: ReadonlyArray<Pick<MessengerOrder, 'deliveryStatus'>>
): boolean {
    return orders.some(isActiveDelivery);
}

/** Indica si el mensajero puede aceptar un pedido asignado. */
export function canAcceptAssignedOrder(
    orders: ReadonlyArray<Pick<MessengerOrder, 'deliveryStatus'>>
): boolean {
    return !hasActiveMessengerDelivery(orders);
}

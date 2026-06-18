import type { OrderDoc, Order } from "../types";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate() as Date;
  }
  return new Date(value as string);
}

export const docToOrder = (id: string, data: OrderDoc): Order => {
  return {
    orderId: id,
    buyerId: data.buyerId ?? '',
    sellerId: data.sellerId ?? '',
    status: data.status,
    total: data.total ?? 0,
    locationId: data.locationId ?? '',
    paymentStatus: data.paymentStatus ?? '',
    paymentId: data.paymentId ?? null,
    deliveryStatus: data.deliveryStatus ?? null,
    deliveryId: data.deliveryId ?? null,
    deliveryCode: data.deliveryCode ?? null,
    incidentReason: data.incidentReason ?? null,
    deliveryFailureReason: data.deliveryFailureReason ?? null,
    deliveryFailureDescription: data.deliveryFailureDescription ?? null,
    confirmedAt: toDate(data.confirmedAt),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

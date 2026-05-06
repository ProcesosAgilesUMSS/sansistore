export type OrderStatus =
  | 'READY_FOR_DELIVERY'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PENDING_REASSIGNMENT'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryOrder = {
  id: string;
  buyerId: string;
  buyerName: string;
  assignedMessengerId: string | null;
  assignedMessengerName: string | null;
  deliveryLocationLabel: string;
  status: OrderStatus;
  createdAt?: Date | null;
  assignedAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
};

export type DeliveryOrderAction = 'accept' | 'reject';

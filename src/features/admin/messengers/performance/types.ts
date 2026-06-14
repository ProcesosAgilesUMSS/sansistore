export interface MessengerOption {
  id: string;
  name: string;
}

export interface MessengerDeliveryPerformance {
  orderId: string;
  messengerId?: string;
  messengerName?: string;
  assignedAt: string;
  deliveredAt: string;
  elapsedTimeMinutes: number;
  status?: string;
}

export interface MessengerPerformanceReport {
  messengerId: string;
  messengerName: string;
  date: string;
  totalDeliveries: number;
  averageDeliveryTimeMinutes: number;
  deliveries: MessengerDeliveryPerformance[];
}

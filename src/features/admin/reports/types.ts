// types.ts — HU #163: Reporte de pedidos cancelados
// Área 7: Administración & Analítica

export type PeriodFilter = 'day' | 'week' | 'month';

export interface CancelledOrder {
  orderId: string;
  cancelledAt: Date;
  customerName: string;
  total: number;
  incidentReason: string | null;
}

export interface CancelledOrdersFilter {
  period: PeriodFilter;
  startDate?: Date;
  endDate?: Date;
}

export interface CancelledOrdersSummary {
  totalCancelled: number;
  cancellationPercentage: number;
}
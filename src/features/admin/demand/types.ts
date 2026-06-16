// types.ts — HU #149: Análisis de demanda por horarios
// Área 7: Administración & Analítica — Nova 2.0

export interface DemandByHour {
  hour: number;
  count: number;
  label: string; // "00:00", "01:00", etc.
}

export interface DemandFilterInput {
  startDate: Date;
  endDate: Date;
  categoryId?: string;
}

export interface DemandTop5 {
  hour: number;
  count: number;
}

export interface DemandSummary {
  byHour: DemandByHour[];
  totalOrders: number;
  peakHour: number;
  minHour: number;
  avgPerHour: number;
  top5: DemandTop5[];
}
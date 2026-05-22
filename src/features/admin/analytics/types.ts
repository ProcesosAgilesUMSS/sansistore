// Tipos para HU #161 — Reportes de ventas por fecha
// Área 7: Administración & Analítica — Nova 2.0

// Un pedido individual en el reporte
export interface SaleOrder {
  orderId: string;
  buyerId: string;
  total: number;
  status: string;
  createdAt: Date;
}

// Resumen del período (KPIs)
export interface SalesSummary {
  totalOrders: number;       // total de pedidos en el rango
  totalIncome: number;       // suma de totales solo de ENTREGADO
  completedOrders: number;   // pedidos con status ENTREGADO
  cancelledOrders: number;   // pedidos con status CANCELADO
  orders: SaleOrder[];       // detalle de todos los pedidos
}

// Input para el filtro de fechas
export interface SalesFilterInput {
  startDate: Date;
  endDate: Date;
}
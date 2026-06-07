// types.ts — HU #160: Monitoreo de actividad de vendedores
// Área 7: Administración & Analítica
//
// Nueva colección Firestore: sellerActivityLogs
// No modifica ninguna colección existente

export type SellerActionType =
  | 'RESERVAR'
  | 'CANCELAR'
  | 'MARCAR_LISTO'
  | 'ASIGNAR'
  | 'REASIGNAR'
  | 'MARCAR_PAGADA'
  | 'MARCAR_DEVUELTA';

export interface SellerActivityLog {
  logId: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  actionType: SellerActionType;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface CreateSellerActivityInput {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  actionType: SellerActionType;
  orderId: string;
  previousStatus: string;
  newStatus: string;
}

export interface SellerActivityFilter {
  startDate?: Date;
  endDate?: Date;
  sellerId?: string;
  actionType?: SellerActionType | 'ALL';
}

export const ACTION_LABELS: Record<SellerActionType, string> = {
  RESERVAR: 'Reservar',
  CANCELAR: 'Cancelar',
  MARCAR_LISTO: 'Marcar listo',
  ASIGNAR: 'Asignar mensajero',
  REASIGNAR: 'Reasignar mensajero',
  MARCAR_PAGADA: 'Marcar pagada',
  MARCAR_DEVUELTA: 'Marcar devuelta',
};
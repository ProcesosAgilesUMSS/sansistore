// types.ts — HU #159: Registro de accesos al sistema para auditoría
// Área 7: Administración & Analítica — Nova 2.0
//
// Nueva colección Firestore: accessLogs
// No modifica ninguna colección existente

export interface AccessLog {
  logId: string;
  uid: string;
  displayName: string;
  email: string;
  roles: string[];           // roles del usuario al momento del acceso
  action: 'LOGIN' | 'LOGOUT';
  timestamp: Date;
  status: 'ACTIVO' | 'CERRADO';
}

// Input para crear un nuevo registro
export interface CreateAccessLogInput {
  uid: string;
  displayName: string;
  email: string;
  roles: string[];
  action: 'LOGIN' | 'LOGOUT';
}

// Filtros para la pantalla de bitácora
export interface AccessLogFilter {
  startDate?: Date;
  endDate?: Date;
  role?: string;             // filtrar por rol específico
  action?: 'LOGIN' | 'LOGOUT' | 'ALL';
}
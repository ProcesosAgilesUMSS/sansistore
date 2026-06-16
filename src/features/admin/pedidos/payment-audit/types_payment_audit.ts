// types.ts — HU #145: Auditoría de cobros
// Área 7: Administración & Analítica

export type PaymentMethod = 'EFECTIVO' | 'QR' | 'TRANSFERENCIA' | 'TARJETA';

export type PaymentStatus = 'VERIFICADO' | 'PENDIENTE' | 'RECHAZADO';

export interface PaymentAuditLog {
    logId: string;
    orderId: string;
    collectedById: string;
    collectedByName: string;
    collectedByEmail: string;
    collectedByRole: 'vendedor' | 'mensajero';
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    timestamp: Date;
}

export interface PaymentAuditFilter {
    orderId?: string;
    startDate?: Date;
    endDate?: Date;
    collectedById?: string;
    paymentMethod?: PaymentMethod | 'ALL';
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    EFECTIVO: 'Efectivo',
    QR: 'QR',
    TRANSFERENCIA: 'Transferencia',
    TARJETA: 'Tarjeta',
};
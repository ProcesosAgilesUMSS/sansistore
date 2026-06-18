// types.ts — HU #145: Auditoría de cobros
// Área 7: Administración & Analítica

export type PaymentMethod = 'EFECTIVO' | 'QR' | 'TRANSFERENCIA' | 'TARJETA';

export type PaymentStatus = 'VERIFICADO' | 'PENDIENTE' | 'RECHAZADO';

export type PaymentCollectorRole = 'VENDEDOR' | 'MENSAJERO' | 'ADMIN';

export interface PaymentCollector {
    id: string;
    nombre: string;
    email: string;
    rol: PaymentCollectorRole;
}

export interface PaymentAuditLog {
    logId: string;
    orderId: string;
    collectedBy: PaymentCollector;
    collectedById: string;
    collectedByName: string;
    collectedByEmail: string;
    collectedByRole: PaymentCollectorRole;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    timestamp: Date;
}

export interface CreatePaymentActivityLogInput {
    orderId: string;
    collectedBy: PaymentCollector;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
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

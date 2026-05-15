export const Payments = {
  PAYMENT_001: {
    code: 'payment-001',
    orderCode: 'order-001',
    amount: 23.2,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
  },
  PAYMENT_002: {
    code: 'payment-002',
    orderCode: 'order-002',
    amount: 128,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
  },
  PAYMENT_003: {
    code: 'payment-003',
    orderCode: 'order-003',
    amount: 10,
    method: 'cash_on_delivery',
    status: 'COBRADO',
    collectedAt: '2026-04-24T15:20:00.000Z',
  },
  PAYMENT_004: {
    code: 'payment-004',
    orderCode: 'order-004',
    amount: 18,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
  },
  PAYMENT_005: {
    code: 'payment-005',
    orderCode: 'order-005',
    amount: 45.5,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
  },
  PAYMENT_006: {
    code: 'payment-006',
    orderCode: 'order-006',
    amount: 206,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
  },
  PAYMENT_007: {
    code: 'payment-007',
    orderCode: 'order-007',
    amount: 27,
    method: 'cash_on_delivery',
    status: 'PAGADO',
    collectedAt: '2026-04-25T08:45:00.000Z',
  },
};

export const paymentList = Object.values(Payments);
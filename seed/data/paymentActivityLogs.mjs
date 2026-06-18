import { Users } from './users.mjs';
import { Orders } from './orders.mjs';

export const paymentActivityLogList = [
  {
    id: 'payment-activity-log-001',
    orderId: Orders.ORDER_001.id,
    collectedBy: {
      id: Users.PEDRO.uid,
      nombre: Users.PEDRO.displayName,
      email: Users.PEDRO.email,
      rol: 'VENDEDOR',
    },
    amount: 23.2,
    paymentMethod: 'EFECTIVO',
    status: 'VERIFICADO',
    timestamp: '2026-06-16T14:32:18.000Z',
  },
  {
    id: 'payment-activity-log-002',
    orderId: Orders.ORDER_002.id,
    collectedBy: {
      id: Users.NADIA.uid,
      nombre: Users.NADIA.displayName,
      email: Users.NADIA.email,
      rol: 'MENSAJERO',
    },
    amount: 128,
    paymentMethod: 'EFECTIVO',
    status: 'VERIFICADO',
    timestamp: '2026-06-16T13:15:42.000Z',
  },
  {
    id: 'payment-activity-log-003',
    orderId: Orders.ORDER_007.id,
    collectedBy: {
      id: Users.LUIS.uid,
      nombre: Users.LUIS.displayName,
      email: Users.LUIS.email,
      rol: 'MENSAJERO',
    },
    amount: 27,
    paymentMethod: 'QR',
    status: 'VERIFICADO',
    timestamp: '2026-06-15T16:45:12.000Z',
  },
  {
    id: 'payment-activity-log-004',
    orderId: Orders.ORDER_010.id,
    collectedBy: {
      id: Users.PEDRO.uid,
      nombre: Users.PEDRO.displayName,
      email: Users.PEDRO.email,
      rol: 'VENDEDOR',
    },
    amount: 32.4,
    paymentMethod: 'TRANSFERENCIA',
    status: 'PENDIENTE',
    timestamp: '2026-06-15T12:28:05.000Z',
  },
  {
    id: 'payment-activity-log-005',
    orderId: Orders.ORDER_024.id,
    collectedBy: {
      id: Users.NADIA.uid,
      nombre: Users.NADIA.displayName,
      email: Users.NADIA.email,
      rol: 'MENSAJERO',
    },
    amount: 58,
    paymentMethod: 'TARJETA',
    status: 'VERIFICADO',
    timestamp: '2026-06-14T10:15:33.000Z',
  },
  {
    id: 'payment-activity-log-006',
    orderId: Orders.ORDER_025.id,
    collectedBy: {
      id: Users.PEDRO.uid,
      nombre: Users.PEDRO.displayName,
      email: Users.PEDRO.email,
      rol: 'VENDEDOR',
    },
    amount: 27.5,
    paymentMethod: 'QR',
    status: 'RECHAZADO',
    timestamp: '2026-06-05T15:05:42.000Z',
  },
];

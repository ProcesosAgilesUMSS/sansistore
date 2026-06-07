import { Users } from './users.mjs';
import { Orders } from './orders.mjs';

// ── HU #160: Monitoreo de actividad de vendedores ──
// Logs de prueba que reflejan acciones reales del vendedor Pedro Quiroga.
// Cada entrada representa un cambio de estado de una orden registrado en
// la colección sellerActivityLogs.

export const activityLogList = [
  // ─── RESERVAR: CREADO → RESERVADO ─────────────────────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'RESERVAR',
    orderId: Orders.ORDER_003.id,
    previousStatus: 'CREADO',
    newStatus: 'RESERVADO',
    timestamp: '2026-06-05T08:15:00.000Z',
  },
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'RESERVAR',
    orderId: Orders.ORDER_004.id,
    previousStatus: 'CREADO',
    newStatus: 'RESERVADO',
    timestamp: '2026-06-05T08:22:30.000Z',
  },

  // ─── MARCAR_LISTO: EMPAQUETADO → LISTO ────────────────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'MARCAR_LISTO',
    orderId: Orders.ORDER_007.id,
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: '2026-06-05T09:10:00.000Z',
  },
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'MARCAR_LISTO',
    orderId: Orders.ORDER_008.id,
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: '2026-06-05T09:25:15.000Z',
  },
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'MARCAR_LISTO',
    orderId: Orders.ORDER_009.id,
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: '2026-06-05T09:42:50.000Z',
  },

  // ─── ASIGNAR: LISTO → ASIGNADO ────────────────────────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'ASIGNAR',
    orderId: Orders.ORDER_007.id,
    previousStatus: 'LISTO',
    newStatus: 'ASIGNADO',
    timestamp: '2026-06-05T10:05:00.000Z',
  },

  // ─── REASIGNAR: PENDIENTE REASIGNACION → ASIGNADO ─────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'REASIGNAR',
    orderId: Orders.ORDER_008.id,
    previousStatus: 'PENDIENTE REASIGNACION',
    newStatus: 'ASIGNADO',
    timestamp: '2026-06-05T11:30:00.000Z',
  },

  // ─── MARCAR_PAGADA: ENTREGADO → PAGADO ────────────────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'MARCAR_PAGADA',
    orderId: Orders.ORDER_002.id,
    previousStatus: 'ENTREGADO',
    newStatus: 'PAGADO',
    timestamp: '2026-06-05T14:32:18.000Z',
  },

  // ─── CANCELAR: RESERVADO → CANCELADO ──────────────────────────
  {
    sellerId: Users.PEDRO.uid,
    sellerName: Users.PEDRO.displayName,
    sellerEmail: Users.PEDRO.email,
    actionType: 'CANCELAR',
    orderId: Orders.ORDER_025.id,
    previousStatus: 'RESERVADO',
    newStatus: 'CANCELADO',
    timestamp: '2026-06-05T15:05:42.000Z',
  },
];

// seed/data/messenger_shift_closures.mjs
//
// Cierres de jornada de mensajeros — colección: messenger_shift_closures
// Schema actualizado: ShiftClosure con summary, completedOrders,
// pendingOrders, incidentOrders y dateKey.
//
// ID del documento: "{courierId}_{dateKey}"  ej: "user-luis_2026-05-15"
//
// Uso desde index.mjs:
//   import { courierSessionList } from './data/messenger_shift_closures.mjs';
//   await seedMessenger_shift_closures();

import { userList } from './users.mjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

const couriers = userList.filter((u) => u.roles?.includes('mensajero'));

// Toma el primer mensajero disponible; si hay más de uno los usa en orden.
function getCourier(index = 0) {
  return couriers[index % couriers.length] ?? null;
}

/**
 * Construye un ShiftOrderSnapshot genérico.
 * cashToCollect = precio del pedido en Bs.
 */
function makeOrder(overrides = {}) {
  return {
    id:                 overrides.id            ?? 'order-placeholder',
    deliveryId:         overrides.deliveryId    ?? 'delivery-placeholder',
    customerName:       overrides.customerName  ?? 'Cliente Ejemplo',
    buyerName:          overrides.buyerName     ?? 'Comprador Invitado',
    phone:              overrides.phone         ?? '70000000',
    address:            overrides.address       ?? 'Av. Heroínas #123',
    city:               overrides.city          ?? 'Cochabamba',
    deliveryStatus:     overrides.deliveryStatus ?? 'delivered',
    paymentStatus:      overrides.paymentStatus ?? 'COBRADO',
    paymentStatusLabel: overrides.paymentStatusLabel ?? 'Cobrado',
    cashToCollect:      overrides.cashToCollect ?? 0,
    paymentCollectedAt: overrides.paymentCollectedAt ?? null,
    assignedAt:         overrides.assignedAt    ?? null,
    updatedAt:          overrides.updatedAt     ?? null,
  };
}

// ── Datos de las jornadas ─────────────────────────────────────────────────────

/*
  Tres escenarios de prueba:

  1. "2026-05-15" — cierre cuadrado (diff = 0)          → status: closed
  2. "2026-05-16" — cierre con faltante (diff < 0)       → status: closed
  3. "2026-05-17" — cierre con sobrante (diff > 0)       → status: closed
  4. "2026-05-14" — ya validado (aprobado)               → status: validated
  5. "2026-05-13" — ya rechazado                         → status: rejected

  Los tres primeros son los que debe mostrar el admin panel pendiente.
*/

export function buildCourierSessionList() {
  const courier0 = getCourier(0);
  if (!courier0) return [];   // Sin mensajeros en userList, no hay seed

  const courier1 = getCourier(1); // Puede ser el mismo si solo hay uno

  const c0id   = courier0.uid;
  const c0name = courier0.displayName ?? courier0.uid;
  const c1id   = courier1.uid;
  const c1name = courier1.displayName ?? courier1.uid;

  // ── Jornada 1: cuadrado perfectamente ─────────────────────────────────────
  const j1completedOrders = [
    makeOrder({ id: 'order-j1-1', deliveryId: 'delivery-j1-1', customerName: 'Ana Pérez',   cashToCollect: 85.50,  paymentCollectedAt: '2026-05-15T09:30:00.000Z', assignedAt: '2026-05-15T08:10:00.000Z', updatedAt: '2026-05-15T09:30:00.000Z' }),
    makeOrder({ id: 'order-j1-2', deliveryId: 'delivery-j1-2', customerName: 'Carlos Vega', cashToCollect: 120.00, paymentCollectedAt: '2026-05-15T10:15:00.000Z', assignedAt: '2026-05-15T08:10:00.000Z', updatedAt: '2026-05-15T10:15:00.000Z' }),
    makeOrder({ id: 'order-j1-3', deliveryId: 'delivery-j1-3', customerName: 'María Ríos',  cashToCollect: 54.00,  paymentCollectedAt: '2026-05-15T11:00:00.000Z', assignedAt: '2026-05-15T08:10:00.000Z', updatedAt: '2026-05-15T11:00:00.000Z' }),
    makeOrder({ id: 'order-j1-4', deliveryId: 'delivery-j1-4', customerName: 'Jorge Lara',  cashToCollect: 52.50,  paymentCollectedAt: '2026-05-15T12:05:00.000Z', assignedAt: '2026-05-15T08:10:00.000Z', updatedAt: '2026-05-15T12:05:00.000Z' }),
  ];
  // totalCollected = suma exacta de cashToCollect = 312.00

  // ── Jornada 2: faltante (mensajero cobró menos) ────────────────────────────
  const j2completedOrders = [
    makeOrder({ id: 'order-j2-1', deliveryId: 'delivery-j2-1', customerName: 'Laura Suárez', cashToCollect: 200.00, paymentCollectedAt: '2026-05-16T09:00:00.000Z', assignedAt: '2026-05-16T08:00:00.000Z', updatedAt: '2026-05-16T09:00:00.000Z' }),
    makeOrder({ id: 'order-j2-2', deliveryId: 'delivery-j2-2', customerName: 'Pedro Mamani', cashToCollect: 150.00, paymentCollectedAt: '2026-05-16T10:20:00.000Z', assignedAt: '2026-05-16T08:00:00.000Z', updatedAt: '2026-05-16T10:20:00.000Z' }),
    makeOrder({ id: 'order-j2-3', deliveryId: 'delivery-j2-3', customerName: 'Rosa Chávez',  cashToCollect: 137.00, paymentCollectedAt: '2026-05-16T11:50:00.000Z', assignedAt: '2026-05-16T08:00:00.000Z', updatedAt: '2026-05-16T11:50:00.000Z' }),
  ];
  // expectedAmount = 487.00 / totalCollected = 442.00 → diff = -45.00

  const j2pendingOrders = [
    makeOrder({ id: 'order-j2-p1', deliveryId: 'delivery-j2-p1', customerName: 'Sandra Flores', cashToCollect: 75.00, deliveryStatus: 'in_transit', paymentStatus: 'PENDIENTE', paymentStatusLabel: 'Pendiente', assignedAt: '2026-05-16T08:00:00.000Z', updatedAt: '2026-05-16T13:00:00.000Z' }),
  ];

  // ── Jornada 3: sobrante (mensajero reportó más de lo esperado) ────────────
  const j3completedOrders = [
    makeOrder({ id: 'order-j3-1', deliveryId: 'delivery-j3-1', customerName: 'Diego Torres',  cashToCollect: 95.00, paymentCollectedAt: '2026-05-17T09:10:00.000Z', assignedAt: '2026-05-17T08:00:00.000Z', updatedAt: '2026-05-17T09:10:00.000Z' }),
    makeOrder({ id: 'order-j3-2', deliveryId: 'delivery-j3-2', customerName: 'Elena Quiroga', cashToCollect: 180.00, paymentCollectedAt: '2026-05-17T10:30:00.000Z', assignedAt: '2026-05-17T08:00:00.000Z', updatedAt: '2026-05-17T10:30:00.000Z' }),
    makeOrder({ id: 'order-j3-3', deliveryId: 'delivery-j3-3', customerName: 'Hugo Ávila',    cashToCollect: 90.00, paymentCollectedAt: '2026-05-17T12:00:00.000Z', assignedAt: '2026-05-17T08:00:00.000Z', updatedAt: '2026-05-17T12:00:00.000Z' }),
  ];
  // expectedAmount = 365.00 / totalCollected = 380.00 → diff = +15.00

  const j3incidentOrders = [
    makeOrder({ id: 'order-j3-i1', deliveryId: 'delivery-j3-i1', customerName: 'Marta Solano', cashToCollect: 60.00, deliveryStatus: 'NOT_DELIVERED', paymentStatus: 'PENDIENTE', paymentStatusLabel: 'Pendiente', assignedAt: '2026-05-17T08:00:00.000Z', updatedAt: '2026-05-17T13:30:00.000Z' }),
  ];

  // ── Jornada 4 (segundo mensajero o mismo): ya aprobada ────────────────────
  const j4completedOrders = [
    makeOrder({ id: 'order-j4-1', deliveryId: 'delivery-j4-1', customerName: 'Beatriz Cano', cashToCollect: 210.00, paymentCollectedAt: '2026-05-14T11:00:00.000Z', assignedAt: '2026-05-14T08:00:00.000Z', updatedAt: '2026-05-14T11:00:00.000Z' }),
    makeOrder({ id: 'order-j4-2', deliveryId: 'delivery-j4-2', customerName: 'Raúl Herrera', cashToCollect: 155.00, paymentCollectedAt: '2026-05-14T12:30:00.000Z', assignedAt: '2026-05-14T08:00:00.000Z', updatedAt: '2026-05-14T12:30:00.000Z' }),
  ];

  // ── Jornada 5: rechazada ───────────────────────────────────────────────────
  const j5completedOrders = [
    makeOrder({ id: 'order-j5-1', deliveryId: 'delivery-j5-1', customerName: 'Claudia Paz', cashToCollect: 330.00, paymentCollectedAt: '2026-05-13T10:45:00.000Z', assignedAt: '2026-05-13T08:00:00.000Z', updatedAt: '2026-05-13T10:45:00.000Z' }),
  ];

  return [
    // ── 1. CERRADO — cuadrado ─────────────────────────────────────────────
    {
      id:          `${c0id}_2026-05-15`,
      courierId:   c0id,
      courierName: c0name,
      dateKey:     '2026-05-15',
      status:      'closed',
      startedAt:   '2026-05-15T08:00:00.000Z',
      closedAt:    '2026-05-15T13:00:00.000Z',
      createdAt:   '2026-05-15T08:00:00.000Z',
      summary: {
        completedCount:    j1completedOrders.length,   // 4
        pendingCount:      0,
        notDeliveredCount: 0,
        cancelledCount:    0,
        totalCollected:    312.00,
      },
      completedOrders: j1completedOrders,
      pendingOrders:   [],
      incidentOrders:  [],
      validatedBy:     null,
      validatedByName: null,
      validatedAt:     null,
      rejectionReason: null,
    },

    // ── 2. CERRADO — faltante (−45 Bs.) ──────────────────────────────────
    {
      id:          `${c0id}_2026-05-16`,
      courierId:   c0id,
      courierName: c0name,
      dateKey:     '2026-05-16',
      status:      'closed',
      startedAt:   '2026-05-16T08:00:00.000Z',
      closedAt:    '2026-05-16T14:20:00.000Z',
      createdAt:   '2026-05-16T08:00:00.000Z',
      summary: {
        completedCount:    j2completedOrders.length,   // 3
        pendingCount:      j2pendingOrders.length,     // 1
        notDeliveredCount: 0,
        cancelledCount:    0,
        totalCollected:    442.00,   // 45 menos que el esperado (487)
      },
      completedOrders: j2completedOrders,
      pendingOrders:   j2pendingOrders,
      incidentOrders:  [],
      validatedBy:     null,
      validatedByName: null,
      validatedAt:     null,
      rejectionReason: null,
    },

    // ── 3. CERRADO — sobrante (+15 Bs.) ──────────────────────────────────
    {
      id:          `${c1id}_2026-05-17`,
      courierId:   c1id,
      courierName: c1name,
      dateKey:     '2026-05-17',
      status:      'closed',
      startedAt:   '2026-05-17T08:00:00.000Z',
      closedAt:    '2026-05-17T14:45:00.000Z',
      createdAt:   '2026-05-17T08:00:00.000Z',
      summary: {
        completedCount:    j3completedOrders.length,   // 3
        pendingCount:      0,
        notDeliveredCount: j3incidentOrders.length,    // 1
        cancelledCount:    0,
        totalCollected:    380.00,  // 15 más que el esperado (365)
      },
      completedOrders: j3completedOrders,
      pendingOrders:   [],
      incidentOrders:  j3incidentOrders,
      validatedBy:     null,
      validatedByName: null,
      validatedAt:     null,
      rejectionReason: null,
    },

    // ── 4. YA APROBADO ────────────────────────────────────────────────────
    {
      id:          `${c0id}_2026-05-14`,
      courierId:   c0id,
      courierName: c0name,
      dateKey:     '2026-05-14',
      status:      'validated',
      startedAt:   '2026-05-14T08:00:00.000Z',
      closedAt:    '2026-05-14T13:30:00.000Z',
      createdAt:   '2026-05-14T08:00:00.000Z',
      summary: {
        completedCount:    j4completedOrders.length,   // 2
        pendingCount:      0,
        notDeliveredCount: 0,
        cancelledCount:    0,
        totalCollected:    365.00,
      },
      completedOrders: j4completedOrders,
      pendingOrders:   [],
      incidentOrders:  [],
      validatedBy:     'admin-uid-placeholder',
      validatedByName: 'Admin Sistema',
      validatedAt:     '2026-05-14T16:00:00.000Z',
      rejectionReason: null,
    },

    // ── 5. YA RECHAZADO ───────────────────────────────────────────────────
    {
      id:          `${c1id}_2026-05-13`,
      courierId:   c1id,
      courierName: c1name,
      dateKey:     '2026-05-13',
      status:      'rejected',
      startedAt:   '2026-05-13T08:00:00.000Z',
      closedAt:    '2026-05-13T13:00:00.000Z',
      createdAt:   '2026-05-13T08:00:00.000Z',
      summary: {
        completedCount:    j5completedOrders.length,   // 1
        pendingCount:      0,
        notDeliveredCount: 0,
        cancelledCount:    0,
        totalCollected:    280.00,  // reportó 280 pero debía ser 330 → diff = -50
      },
      completedOrders: j5completedOrders,
      pendingOrders:   [],
      incidentOrders:  [],
      validatedBy:     'admin-uid-placeholder',
      validatedByName: 'Admin Sistema',
      validatedAt:     '2026-05-13T17:30:00.000Z',
      rejectionReason: 'El monto registrado (Bs. 280.00) no coincide con la suma de los pedidos entregados (Bs. 330.00). Se requiere revisión del efectivo.',
    },
  ];
}

export const courierSessionList = buildCourierSessionList();

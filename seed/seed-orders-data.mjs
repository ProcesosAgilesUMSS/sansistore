export const seedUsers = [
  {
    uid: 'user-comprador-001',
    email: 'ana.comprador@umss.edu.bo',
    displayName: 'Ana Mamani',
    roles: ['COMPRADOR'],
    institutionalId: 'EST-2024-001',
    isActive: true,
    createdBy: 'seeder',
  },
  {
    uid: 'user-comprador-002',
    email: 'carlos.docente@umss.edu.bo',
    displayName: 'Carlos Flores',
    roles: ['COMPRADOR'],
    institutionalId: 'DOC-2023-042',
    isActive: true,
    createdBy: 'seeder',
  },
  {
    uid: 'user-vendedor-001',
    email: 'pedro.vendedor@umss.edu.bo',
    displayName: 'Pedro Quiroga',
    roles: ['VENDEDOR'],
    institutionalId: 'ADM-2022-010',
    isActive: true,
    createdBy: 'seeder',
  },
  {
    uid: 'user-mensajero-001',
    email: 'luis.mensajero@umss.edu.bo',
    displayName: 'Luis Torrez',
    roles: ['MENSAJERO'],
    institutionalId: 'SRV-2023-007',
    isActive: true,
    createdBy: 'seeder',
  },
  {
    uid: 'user-admin-001',
    email: 'admin@umss.edu.bo',
    displayName: 'Administrador SANSÍ',
    roles: ['ADMINISTRADOR'],
    institutionalId: 'ADM-2020-001',
    isActive: true,
    createdBy: 'seeder',
  },
];

// ── UBICACIONES ───────────────────────────────────────────────────────────────
// Ubicaciones dentro del campus UMSS registradas por los compradores
export const seedLocations = [
  {
    locationId: 'loc-001',
    userId: 'user-comprador-001',
    label: 'Aula 3B - Facultad de Ciencias',
    type: 'aula',
    lat: -17.39318,
    lng: -66.15282,
    isDefault: true,
  },
  {
    locationId: 'loc-002',
    userId: 'user-comprador-001',
    label: 'Laboratorio de Computación - Piso 2',
    type: 'laboratorio',
    lat: -17.39290,
    lng: -66.15260,
    isDefault: false,
  },
  {
    locationId: 'loc-003',
    userId: 'user-comprador-002',
    label: 'Oficina Docentes - Bloque A',
    type: 'oficina',
    lat: -17.39350,
    lng: -66.15310,
    isDefault: true,
  },
];

// ── ÓRDENES ───────────────────────────────────────────────────────────────────
// Estados del flujo:
//   CREADO → RESERVADO → LISTO → ASIGNADO → EN CAMINO → ENTREGADO → PAGADO
//
// Para la HU "marcar como LISTO" se necesitan pedidos en RESERVADO
// Se incluyen también otros estados para tener contexto realista en la lista
export const seedOrders = [
  // ── Pedido principal: RESERVADO → el vendedor lo marcará LISTO ────────────
  {
    orderId: 'order-001',
    buyerId: 'user-comprador-001',
    sellerId: 'user-vendedor-001',
    status: 'RESERVADO',           // ← estado que el vendedor cambiará a LISTO
    total: 23.2,                   // 9.7 (leche) + 13.5 (arroz)
    locationId: 'loc-001',
    paymentStatus: 'PENDIENTE',
    deliveryStatus: null,
    deliveryId: null,
    paymentId: null,
    incidentReason: null,
    confirmedAt: '2026-04-25T09:00:00.000Z',
    cancelledAt: null,
    createdAt: '2026-04-25T08:50:00.000Z',
    updatedAt: '2026-04-25T09:00:00.000Z',
    // orderItems (subcollección)
    items: [
      {
        itemId: 'item-001-a',
        productId: '5f1c7b56-1dc5-4d48-a3a6-7f0d9c7d1011', // Leche PIL Natural 900 ml
        productName: 'Leche PIL Natural 900 ml',
        unitPrice: 9.7,
        quantity: 1,
        subtotal: 9.7,
      },
      {
        itemId: 'item-001-b',
        productId: '9950d7ec-1222-4268-a95b-d1818e6c4044', // Arroz Grano de Oro 1 kg
        productName: 'Arroz Grano de Oro Caisy 1 kg',
        unitPrice: 13.5,
        quantity: 1,
        subtotal: 13.5,
      },
    ],
  },

  // ── Segundo pedido RESERVADO (para tener lista con múltiples items) ────────
  {
    orderId: 'order-002',
    buyerId: 'user-comprador-002',
    sellerId: 'user-vendedor-001',
    status: 'RESERVADO',
    total: 128,                    // 123 (detergente) + 5 extra por cantidad
    locationId: 'loc-003',
    paymentStatus: 'PENDIENTE',
    deliveryStatus: null,
    deliveryId: null,
    paymentId: null,
    incidentReason: null,
    confirmedAt: '2026-04-25T09:30:00.000Z',
    cancelledAt: null,
    createdAt: '2026-04-25T09:20:00.000Z',
    updatedAt: '2026-04-25T09:30:00.000Z',
    items: [
      {
        itemId: 'item-002-a',
        productId: 'c3e77f4c-2cb5-4ce2-9134-a15466777077', // Detergente Ola 5 L
        productName: 'Detergente Liquido Ola Futuro 5 L',
        unitPrice: 109,            // precio con oferta activa
        quantity: 1,
        subtotal: 109,
      },
      {
        itemId: 'item-002-b',
        productId: 'b62fd8d5-1d66-4f39-a26f-6b7e9fda9088', // Galletas Victoria
        productName: 'Galletas Agua Victoria 120 gr',
        unitPrice: 8,
        quantity: 2,
        subtotal: 16,
      },
    ],
  },

  // ── Pedido ya en LISTO (ya fue procesado, sirve para ver el estado destino) ─
  {
    orderId: 'order-003',
    buyerId: 'user-comprador-001',
    sellerId: 'user-vendedor-001',
    status: 'LISTO_PARA_ENTREGA',               // ← estado resultado después de la HU
    total: 10,
    locationId: 'loc-002',
    paymentStatus: 'PENDIENTE',
    deliveryStatus: 'LISTO_PARA_ENTREGA',
    deliveryId: 'delivery-003',
    paymentId: null,
    incidentReason: null,
    confirmedAt: '2026-04-24T14:00:00.000Z',
    cancelledAt: null,
    createdAt: '2026-04-24T13:50:00.000Z',
    updatedAt: '2026-04-24T14:30:00.000Z',
    items: [
      {
        itemId: 'item-003-a',
        productId: 'aa2941bf-5f4f-4c8d-bb17-61977dcd6066', // Mocochinchi 100 gr
        productName: 'Mocochinchi Soproma 100 gr',
        unitPrice: 10,
        quantity: 1,
        subtotal: 10,
      },
    ],
  },

  // ── Pedido ASIGNADO (ya tiene mensajero, pasó por LISTO) ─────────────────
  {
    orderId: 'order-004',
    buyerId: 'user-comprador-002',
    sellerId: 'user-vendedor-001',
    status: 'ASIGNADO',
    total: 18,
    locationId: 'loc-003',
    paymentStatus: 'PENDIENTE',
    deliveryStatus: 'ASIGNADO',
    deliveryId: 'delivery-004',
    paymentId: null,
    incidentReason: null,
    confirmedAt: '2026-04-24T10:00:00.000Z',
    cancelledAt: null,
    createdAt: '2026-04-24T09:50:00.000Z',
    updatedAt: '2026-04-24T10:45:00.000Z',
    items: [
      {
        itemId: 'item-004-a',
        productId: 'fb4fef79-3a32-4720-9f27-1ac9d4b3b033', // Aceite Fino 900 ml
        productName: 'Aceite Fino Vegetal 900 ml',
        unitPrice: 18,
        quantity: 1,
        subtotal: 18,
      },
    ],
  },

  // ── Pedido CANCELADO (para contexto en la lista del vendedor) ─────────────
  {
    orderId: 'order-005',
    buyerId: 'user-comprador-001',
    sellerId: 'user-vendedor-001',
    status: 'CANCELADO',
    total: 6.5,
    locationId: 'loc-001',
    paymentStatus: 'CANCELADO',
    deliveryStatus: null,
    deliveryId: null,
    paymentId: null,
    incidentReason: 'Cliente canceló antes de preparación',
    confirmedAt: null,
    cancelledAt: '2026-04-23T11:00:00.000Z',
    createdAt: '2026-04-23T10:40:00.000Z',
    updatedAt: '2026-04-23T11:00:00.000Z',
    items: [
      {
        itemId: 'item-005-a',
        productId: '4ec27ef8-64d3-46cf-b48a-c8e76f0f5055', // Fideo Lazzaroni
        productName: 'Fideo Lazzaroni Spaguetto 52 400 gr',
        unitPrice: 6.5,
        quantity: 1,
        subtotal: 6.5,
      },
    ],
  },
];

// ── DELIVERIES ────────────────────────────────────────────────────────────────
// Solo se crean deliveries para pedidos que ya pasaron por LISTO o ASIGNADO
// Los pedidos RESERVADO aún no tienen delivery — se crea al marcar LISTO
export const seedDeliveries = [
  // Delivery del order-003 (LISTO — recién marcado por el vendedor)
  {
    deliveryId: 'delivery-003',
    orderId: 'order-003',
    courierId: null,               // aún sin mensajero asignado
    status: 'CREADO',
    deliveryCode: 'DEL-2024-003',
    attemptNumber: 1,
    incidentReason: null,
    evidenceUrl: null,
    failureReason: null,
    amountCollected: null,
    customerConfirmed: false,
    customerConfirmedAt: null,
    assignedAt: null,
    pickedUpAt: null,
    inTransitAt: null,
    deliveredAt: null,
    failedAt: null,
    reprogrammedAt: null,
    createdAt: '2026-04-24T14:30:00.000Z',
    updatedAt: '2026-04-24T14:30:00.000Z',
  },

  // Delivery del order-004 (ASIGNADO — ya tiene mensajero)
  {
    deliveryId: 'delivery-004',
    orderId: 'order-004',
    courierId: 'user-mensajero-001',
    status: 'ASIGNADO',
    deliveryCode: 'DEL-2024-004',
    attemptNumber: 1,
    incidentReason: null,
    evidenceUrl: null,
    failureReason: null,
    amountCollected: null,
    customerConfirmed: false,
    customerConfirmedAt: null,
    assignedAt: '2026-04-24T10:45:00.000Z',
    pickedUpAt: null,
    inTransitAt: null,
    deliveredAt: null,
    failedAt: null,
    reprogrammedAt: null,
    createdAt: '2026-04-24T10:45:00.000Z',
    updatedAt: '2026-04-24T10:45:00.000Z',
  },
];

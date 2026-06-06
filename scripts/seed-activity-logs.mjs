/**
 * Seed script — Crea documentos de prueba en la colección sellerActivityLogs
 * del emulador Firestore para verificar que el panel de monitoreo funciona.
 * Solo para desarrollo local
 *
 * Uso: node scripts/seed-activity-logs.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, Timestamp } from 'firebase/firestore';

const app = initializeApp({
  projectId: 'sansistore',
  apiKey: 'dummy',
});

const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

// ── Logs de prueba usando IDs reales de órdenes del seed (seed/data/orders.mjs) ──
// Todas las acciones son del ROL VENDEDOR (seller).
// Pedro Quiroga (user-pedro) es el vendedor asignado en la mayoría de órdenes seed.

const logs = [
  // ─── RESERVAR: CREADO → RESERVADO ─────────────────────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'RESERVAR',
    orderId: '019e74a3-be7e-74b8-9c86-b63582359dbe_b8e-ees',  // ORDER_003
    previousStatus: 'CREADO',
    newStatus: 'RESERVADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T08:15:00')),
  },
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'RESERVAR',
    orderId: '019e74a3-d006-739e-b281-04a5a451ecca_jm3-udk',  // ORDER_004
    previousStatus: 'CREADO',
    newStatus: 'RESERVADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T08:22:30')),
  },

  // ─── MARCAR_LISTO: EMPAQUETADO → LISTO ────────────────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'MARCAR_LISTO',
    orderId: '019e74a4-0c66-769e-946b-6a2d98ec9d43_8dr-ani',  // ORDER_007 (EMPAQUETADO)
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T09:10:00')),
  },
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'MARCAR_LISTO',
    orderId: '019e74a4-245b-77da-a4e3-ac36bfc0926d_p19-trc',  // ORDER_008 (EMPAQUETADO)
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T09:25:15')),
  },
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'MARCAR_LISTO',
    orderId: '019e74a4-3936-77ea-8f13-7b299f44ffc0_c3a-9ge',  // ORDER_009 (EMPAQUETADO)
    previousStatus: 'EMPAQUETADO',
    newStatus: 'LISTO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T09:42:50')),
  },

  // ─── ASIGNAR: LISTO → ASIGNADO ────────────────────────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'ASIGNAR',
    orderId: '019e74a4-0c66-769e-946b-6a2d98ec9d43_8dr-ani',  // ORDER_007
    previousStatus: 'LISTO',
    newStatus: 'ASIGNADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T10:05:00')),
  },

  // ─── REASIGNAR: PENDIENTE REASIGNACION → ASIGNADO ─────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'REASIGNAR',
    orderId: '019e74a4-245b-77da-a4e3-ac36bfc0926d_p19-trc',  // ORDER_008
    previousStatus: 'PENDIENTE REASIGNACION',
    newStatus: 'ASIGNADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T11:30:00')),
  },

  // ─── MARCAR_PAGADA: ENTREGADO → PAGADO ────────────────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'MARCAR_PAGADA',
    orderId: '019e74a3-4741-7552-b542-a53c01ca0cf5_wab-4ok',  // ORDER_002 (ENTREGADO)
    previousStatus: 'ENTREGADO',
    newStatus: 'PAGADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T14:32:18')),
  },

  // ─── CANCELAR: RESERVADO → CANCELADO ──────────────────────────
  {
    sellerId: 'user-pedro',
    sellerName: 'Pedro Quiroga',
    sellerEmail: 'pedro.vendedor@est.umss.edu',
    actionType: 'CANCELAR',
    orderId: '019e74a5-808a-7321-9127-281f098b2d8e_3dg-zjs',  // ORDER_025
    previousStatus: 'RESERVADO',
    newStatus: 'CANCELADO',
    timestamp: Timestamp.fromDate(new Date('2026-06-05T15:05:42')),
  },
];

const COL = 'sellerActivityLogs';

console.log(`🔥 Creando ${logs.length} documentos en "${COL}"...`);

for (const log of logs) {
  const ref = await addDoc(collection(db, COL), log);
  console.log(`  ✅ ${log.actionType.padEnd(15)} ${log.previousStatus} → ${log.newStatus}  (${ref.id})`);
}

console.log('\n✨ Seed completado. Revisá http://localhost:4000/firestore');
console.log('   y luego Admin → Configuración → Monitoreo');
process.exit(0);

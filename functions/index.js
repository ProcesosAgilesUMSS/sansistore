/**
 * Cloud Functions
 * Área 7: Administración & Analítica — Nova 2.0
 *
 * HU #152: Definir tiempo límite de reserva
 * Esta función corre automáticamente cada 5 minutos y libera
 * el stock de pedidos RESERVADOS que superaron el tiempo límite.
 */

// El proyecto usa ES modules (type: "module") por eso usamos import
// en lugar de require()
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";

// Inicializar Firebase Admin SDK
// Esto da acceso a Firestore con permisos de administrador
// (no sujeto a las reglas de seguridad de Firestore)
initializeApp();

const db = getFirestore();

export const marcarTiempoReserva = onDocumentUpdated(
    {
      document: "orders/{orderId}",
      region: "southamerica-east1",
    },
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (before.status === "RESERVADO" || after.status !== "RESERVADO") {
        return;
      }

      if (after.reservedAt) {
        return;
      }

      await event.data.after.ref.update({
        reservedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
);

// ── FUNCIÓN: liberarReservas ────────────────────────────────────
// Se ejecuta automáticamente cada 5 minutos
// Busca pedidos en estado RESERVADO que superaron el tiempo límite
// y los cancela, liberando el stock correspondiente
export const liberarReservas = onSchedule(
    {
      schedule: "every 5 minutes",
      region: "southamerica-east1",
      timeoutSeconds: 60,
    },
    async () => {
      try {
      // ── Paso 1: Leer el tiempo límite desde settings/config ──
        const settingsRef = db.collection("settings").doc("config");
        const settingsSnap = await settingsRef.get();

        const reservationTimeLimit = settingsSnap.exists ?
        (settingsSnap.data().reservationTimeLimit ?? 30) :
        30;

        const limitMs = reservationTimeLimit * 60 * 1000;
        const cutoffTime = new Date(Date.now() - limitMs);
        const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

        const cutoffIso = cutoffTime.toISOString();
        console.log(
            "[liberarReservas] Buscando pedidos RESERVADO antes de: " +
            `${cutoffIso} (límite: ${reservationTimeLimit} min)`,
        );

        // ── Paso 2: Buscar pedidos RESERVADO vencidos ────────────
        const ordersSnap = await db
            .collection("orders")
            .where("status", "==", "RESERVADO")
            .where("reservedAt", "<", cutoffTimestamp)
            .get();

        if (ordersSnap.empty) {
          console.log(
              "[liberarReservas] No hay pedidos vencidos. Nada que liberar.",
          );
          return;
        }

        console.log(
            "[liberarReservas] Pedidos vencidos encontrados: " +
            ordersSnap.size,
        );

        // ── Paso 3: Procesar cada pedido vencido ─────────────────
        const promises = ordersSnap.docs.map(async (orderDoc) => {
          const orderId = orderDoc.id;
          // orderData eliminado — no se usaba

          console.log(`[liberarReservas] Procesando pedido: ${orderId}`);

          // Obtener los items del pedido (subcolección orderItems)
          const itemsSnap = await db
              .collection("orders")
              .doc(orderId)
              .collection("orderItems")
              .get();

          // Batch: operación atómica — todo o nada
          const batch = db.batch();

          // Cancelar el pedido
          const orderRef = db.collection("orders").doc(orderId);
          batch.update(orderRef, {
            status: "CANCELADO",
            incidentReason: "Tiempo límite de reserva superado",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          });

          // Liberar stock de cada item
          itemsSnap.docs.forEach((itemDoc) => {
            const {productId, quantity} = itemDoc.data();
            if (!productId || !quantity) return;

            const inventoryRef = db
                .collection("inventory")
                .doc(productId);

            batch.update(inventoryRef, {
              stockReserved: FieldValue.increment(-quantity),
              stockAvailable: FieldValue.increment(quantity),
            });
          });

          await batch.commit();
          console.log(
              `[liberarReservas] ✓ Pedido ${orderId} cancelado. ` +
              `${itemsSnap.size} items liberados.`,
          );
        });

        await Promise.all(promises);
        console.log(
            "[liberarReservas] ✅ Proceso completado. " +
            `${ordersSnap.size} pedidos cancelados.`,
        );
      } catch (error) {
        console.error("[liberarReservas] ❌ Error:", error);
        throw error;
      }
    },
);

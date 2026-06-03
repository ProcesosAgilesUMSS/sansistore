import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import nodemailer from "nodemailer";

initializeApp();

const db = getFirestore();

const gmailUser = defineSecret("GMAIL_USER");
const gmailPass = defineSecret("GMAIL_PASS");

/**
 * Convierte valores Timestamp/Date/string de Firestore a Date.
 * @param {unknown} value Valor de fecha.
 * @return {Date|null} Fecha normalizada.
 */
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Cancela pedidos vencidos y libera su stock reservado.
 * @param {FirebaseFirestore.QueryDocumentSnapshot[]} orderDocs Pedidos.
 * @return {Promise<number>} Cantidad de pedidos cancelados.
 */
async function cancelExpiredOrders(orderDocs) {
  if (orderDocs.length === 0) {
    return 0;
  }

  const promises = orderDocs.map(async (orderDoc) => {
    const orderId = orderDoc.id;

    console.log(`[liberarReservas] Procesando pedido: ${orderId}`);

    const itemsSnap = await db
        .collection("orders")
        .doc(orderId)
        .collection("orderItems")
        .get();

    const batch = db.batch();
    const orderRef = db.collection("orders").doc(orderId);

    batch.update(orderRef, {
      status: "CANCELADO",
      incidentReason: "Tiempo límite de reserva superado",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    itemsSnap.docs.forEach((itemDoc) => {
      const {productId, quantity} = itemDoc.data();
      if (!productId || !quantity) return;
      const inventoryRef = db.collection("inventory").doc(productId);
      batch.update(inventoryRef, {
        stockReserved: FieldValue.increment(-quantity),
        stockAvailable: FieldValue.increment(quantity),
      });
    });

    await batch.commit();
    console.log(
        `[liberarReservas] Pedido ${orderId} cancelado. ` +
        `${itemsSnap.size} items liberados.`,
    );
  });

  await Promise.all(promises);
  return orderDocs.length;
}

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

export const liberarReservas = onSchedule(
    {
      schedule: "every 5 minutes",
      region: "southamerica-east1",
      timeoutSeconds: 60,
    },
    async () => {
      try {
        const settingsRef = db.collection("settings").doc("config");
        const settingsSnap = await settingsRef.get();

        const reservationTimeLimit = settingsSnap.exists ?
          (settingsSnap.data().reservationTimeLimit ?? 30) :
          30;

        const limitMs = reservationTimeLimit * 60 * 1000;
        const cutoffTime = new Date(Date.now() - limitMs);

        const cutoffIso = cutoffTime.toISOString();
        console.log(
            "[liberarReservas] Buscando pedidos RESERVADO antes de: " +
            `${cutoffIso} (límite: ${reservationTimeLimit} min)`,
        );

        const reservedOrdersSnap = await db
            .collection("orders")
            .where("status", "==", "RESERVADO")
            .get();

        const expiredOrders = reservedOrdersSnap.docs.filter((orderDoc) => {
          const data = orderDoc.data();
          const referenceDate =
            toDate(data.reservedAt) ?? toDate(data.createdAt);
          return referenceDate !== null && referenceDate < cutoffTime;
        });

        if (expiredOrders.length === 0) {
          console.log(
              "[liberarReservas] No hay pedidos vencidos. Nada que liberar.",
          );
          return;
        }

        console.log(
            "[liberarReservas] Pedidos vencidos encontrados: " +
            expiredOrders.length,
        );

        const cancelledOrders = await cancelExpiredOrders(expiredOrders);

        console.log(
            "[liberarReservas] ✅ Proceso completado. " +
            `${cancelledOrders} pedidos cancelados.`,
        );
      } catch (error) {
        console.error("[liberarReservas] ❌ Error:", error);
        throw error;
      }
    },
);

export const notificarStockDisponible = onDocumentUpdated(
    {
      document: "inventory/{productId}",
      region: "southamerica-east1",
      secrets: [gmailUser, gmailPass],
    },
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      const stockAntes = before.stockAvailable ?? 0;
      const stockDespues = after.stockAvailable ?? 0;

      if (stockAntes > 0 || stockDespues <= 0) {
        return;
      }

      const productId = event.params.productId;
      console.log(`[notificarStock] Stock disponible para: ${productId}`);

      const subscribersSnap = await db
          .collection("stockAlerts")
          .doc(productId)
          .collection("subscribers")
          .get();

      if (subscribersSnap.empty) {
        console.log(`[notificarStock] Sin suscriptores para: ${productId}`);
        return;
      }

      const productSnap = await db
          .collection("products")
          .doc(productId)
          .get();

      const productName = productSnap.exists ?
        (productSnap.data().name ?? productId) :
        productId;

      const productSlug = productSnap.exists ?
        (productSnap.data().slug ?? productId) :
        productId;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser.value(),
          pass: gmailPass.value(),
        },
      });

      const userIds = subscribersSnap.docs.map((d) => d.data().userId);

      const usersSnap = await Promise.all(
          userIds.map((uid) => db.collection("users").doc(uid).get()),
      );

      const baseUrl = "http://localhost:4321/productos";

      const emailPromises = usersSnap
          .filter((snap) => snap.exists && snap.data().email)
          .map(async (snap) => {
            const email = snap.data().email;
            const displayName = snap.data().displayName ?? "Cliente";

            await transporter.sendMail({
              from: `"SansiStore" <${gmailUser.value()}>`,
              to: email,
              subject: `¡${productName} ya está disponible!`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;">
                  <h2 style="color:#22c55e;">
                    ¡Buenas noticias, ${displayName}!
                  </h2>
                  <p>El producto que esperabas ya tiene stock:</p>
                  <h3 style="color:#333;">${productName}</h3>
                  <a
                    href="${baseUrl}/${productSlug}"
                    style="
                      display:inline-block;
                      background-color:#22c55e;
                      color:white;
                      padding:12px 24px;
                      border-radius:24px;
                      text-decoration:none;
                      font-weight:bold;
                      margin-top:16px;
                    "
                  >
                    Ver producto
                  </a>
                  <p style="color:#888;font-size:12px;margin-top:24px;">
                    Te suscribiste a alertas de stock en SansiStore.
                  </p>
                </div>
              `,
            });

            console.log(`[notificarStock] Correo enviado a: ${email}`);
          });

      await Promise.all(emailPromises);

      const batch = db.batch();
      subscribersSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      const count = subscribersSnap.size;
      console.log(
          `[notificarStock] ✅ ${count} suscriptores notificados.`,
      );
    },
);

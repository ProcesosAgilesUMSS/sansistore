import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

type UndeliveredOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
};

async function readOrderItems(
  db: Firestore,
  orderId: string,
): Promise<UndeliveredOrderItem[]> {
  const itemsSnap = await getDocs(collection(db, 'orders', orderId, 'orderItems'));

  return itemsSnap.docs.map((itemDoc) => {
    const data = itemDoc.data();

    return {
      productId: String(data.productId || ''),
      productName: String(data.productName || 'Producto'),
      quantity: Number(data.quantity || 0),
    };
  });
}

export async function restartUndeliveredOrder(
  db: Firestore,
  orderId: string,
  sellerId: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const items = await readOrderItems(db, orderId);

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const orderData = orderSnap.data();

    if (orderData.sellerId !== sellerId) {
      throw new Error('No puedes reiniciar un pedido de otro vendedor.');
    }

    if (orderData.status !== 'NO ENTREGADO') {
      throw new Error(`Solo se pueden reiniciar pedidos NO ENTREGADO. Estado actual: ${orderData.status}.`);
    }

    const stockRestored = Boolean(orderData.stockRestored);

    if (stockRestored) {
      const reservableItems = items.filter(
        (item) => item.productId && item.quantity > 0,
      );
      const inventoryRefs = reservableItems.map((item) =>
        doc(db, 'inventory', item.productId),
      );
      const inventorySnaps = await Promise.all(
        inventoryRefs.map((inventoryRef) => tx.get(inventoryRef)),
      );

      inventorySnaps.forEach((inventorySnap, index) => {
        const item = reservableItems[index];

        if (!inventorySnap.exists()) {
          throw new Error(`No se encontró inventario para ${item.productName}.`);
        }

        const inventory = inventorySnap.data();
        const currentAvailable = Number(inventory.stockAvailable ?? 0);
        const currentReserved = Number(inventory.stockReserved ?? 0);
        const effectiveStock = currentAvailable - currentReserved;

        if (effectiveStock < item.quantity) {
          throw new Error(
            `No hay stock suficiente para volver a reservar ${item.productName}.`,
          );
        }
      });

      reservableItems.forEach((item, index) => {
        const inventory = inventorySnaps[index].data();
        const currentReserved = Number(inventory?.stockReserved ?? 0);

        tx.update(inventoryRefs[index], {
          stockReserved: currentReserved + item.quantity,
          updatedAt: serverTimestamp(),
        });
      });
    }

    tx.update(orderRef, {
      status: 'RESERVADO',
      deliveryId: null,
      deliveryStatus: null,
      incidentReason: null,
      incidentNotes: null,
      failedAt: null,
      cancelledAt: null,
      stockRestored: false,
      stockRestoredAt: null,
      stockRestoredBy: null,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function cancelUndeliveredOrder(
  db: Firestore,
  orderId: string,
  sellerId: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const items = await readOrderItems(db, orderId);

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('El pedido no existe.');
    }

    const orderData = orderSnap.data();

    if (orderData.sellerId !== sellerId) {
      throw new Error('No puedes cancelar un pedido de otro vendedor.');
    }

    if (orderData.status !== 'NO ENTREGADO') {
      throw new Error(`Solo se pueden cancelar pedidos NO ENTREGADO. Estado actual: ${orderData.status}.`);
    }

    const stockRestored = Boolean(orderData.stockRestored);

    if (!stockRestored) {
      const releasableItems = items.filter(
        (item) => item.productId && item.quantity > 0,
      );
      const inventoryRefs = releasableItems.map((item) =>
        doc(db, 'inventory', item.productId),
      );
      const inventorySnaps = await Promise.all(
        inventoryRefs.map((inventoryRef) => tx.get(inventoryRef)),
      );

      inventorySnaps.forEach((inventorySnap, index) => {
        const item = releasableItems[index];

        if (!inventorySnap.exists()) {
          throw new Error(`No se encontró inventario para ${item.productName}.`);
        }

        const inventory = inventorySnap.data();
        const currentReserved = Number(inventory.stockReserved ?? 0);

        if (currentReserved < item.quantity) {
          throw new Error(
            `El producto ${item.productName} no tiene stock reservado suficiente para cancelar el pedido.`,
          );
        }
      });

      releasableItems.forEach((item, index) => {
        const inventory = inventorySnaps[index].data();
        const currentReserved = Number(inventory?.stockReserved ?? 0);

        tx.update(inventoryRefs[index], {
          stockReserved: currentReserved - item.quantity,
          updatedAt: serverTimestamp(),
        });
      });
    }

    tx.update(orderRef, {
      status: 'CANCELADO',
      deliveryId: null,
      deliveryStatus: null,
      cancelledAt: serverTimestamp(),
      incidentReason:
        typeof orderData.incidentReason === 'string' && orderData.incidentReason.trim()
          ? orderData.incidentReason
          : 'Cancelado por vendedor tras entrega fallida',
      stockRestored: true,
      stockRestoredAt: serverTimestamp(),
      stockRestoredBy: sellerId,
      updatedAt: serverTimestamp(),
    });
  });
}

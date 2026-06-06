import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  type DocumentData,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
  type QuerySnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Order, OrderItem, ReturnRequest, Delivery } from "@features/orders/types";

// ── HU #160: Monitoreo de actividad de vendedores ──
import { registrarActividadVendedor } from '../../admin/monitoring/services/sellerActivityService';

// --- Seller Actions ---

export async function paidOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No autenticado");

  const orderRef = doc(db, "orders", orderId);
  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = itemsSnapshot.docs.map(doc => ({
    itemId: doc.id,
    ...(doc.data() as Omit<OrderItem, "itemId">)
  }));

  await runTransaction(db, async (transaction) => {
    // 1. Gather all reads
    const invRefs = items.map(item => doc(db, "inventory", item.productId));
    const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));

    // 2. Perform all writes
    transaction.update(orderRef, {
      status: "PAGADO",
      updatedAt: serverTimestamp(),
    });

    invSnaps.forEach((invSnap, index) => {
      if (!invSnap.exists()) {
        throw new Error(`Inventario no encontrado para el producto: ${items[index].productId}`);
      }

      const invData = invSnap.data();
      const currentTotal = invData.stockTotal || 0;
      const currentReserved = invData.stockReserved || 0;
      const qty = items[index].quantity || 0;

      transaction.update(invRefs[index], {
        stockTotal: currentTotal - qty,
        stockReserved: currentReserved - qty,
        updatedAt: serverTimestamp(),
      });
    });
  });

  // ── HU #160: Registrar actividad del vendedor ──
  const sellerSnap = await getDoc(doc(db, 'users', user.uid));
  const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
  registrarActividadVendedor({
    sellerId: user.uid,
    sellerName: sellerData.displayName ?? 'Vendedor',
    sellerEmail: sellerData.email ?? '',
    actionType: 'MARCAR_PAGADA',
    orderId,
    previousStatus: 'ENTREGADO',
    newStatus: 'PAGADO',
  }).catch((err) => console.error('❌ ERROR al registrar actividad:', err));
}

export async function returnOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe estar autenticado para reservar un pedido.");

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "DEVUELTO",
    updatedAt: serverTimestamp(),
  });
}


export async function reserveOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe estar autenticado para reservar un pedido.");

  const orderRef = doc(db, "orders", orderId);
  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = itemsSnapshot.docs.map(doc => ({
    itemId: doc.id,
    ...(doc.data() as Omit<OrderItem, "itemId">)
  }));

  await runTransaction(db, async (transaction) => {
    // 1. Gather all reads
    const invRefs = items.map(item => doc(db, "inventory", item.productId));
    const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));

    // 2. Perform all writes
    transaction.update(orderRef, {
      status: "RESERVADO",
      sellerId: user.uid,
      updatedAt: serverTimestamp(),
    });

    invSnaps.forEach((invSnap, index) => {
      if (!invSnap.exists()) {
        throw new Error(`Inventario no encontrado para el producto: ${items[index].productId}`);
      }

      const invData = invSnap.data();
      const currentAvailable = invData.stockAvailable || 0;
      const qty = items[index].quantity || 0;

      transaction.update(invRefs[index], {
        stockAvailable: currentAvailable - qty,
        updatedAt: serverTimestamp(),
      });
    });
  });

  // ── HU #160: Registrar actividad del vendedor ──
  const sellerSnap = await getDoc(doc(db, 'users', user.uid));
  const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
  registrarActividadVendedor({
    sellerId: user.uid,
    sellerName: sellerData.displayName ?? 'Vendedor',
    sellerEmail: sellerData.email ?? '',
    actionType: 'RESERVAR',
    orderId,
    previousStatus: 'CREADO',
    newStatus: 'RESERVADO',
  }).catch((err) => console.error('No se pudo registrar la actividad:', err));
}

export async function readyOrder(orderId: string): Promise<void> {
  //camila-160
  const user = auth.currentUser;
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "LISTO",
    updatedAt: serverTimestamp(),
  });

  // ── HU #160: Registrar actividad del vendedor ──
  if (user) {
    const sellerSnap = await getDoc(doc(db, 'users', user.uid));
    const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
    registrarActividadVendedor({
      sellerId: user.uid,
      sellerName: sellerData.displayName ?? 'Vendedor',
      sellerEmail: sellerData.email ?? '',
      actionType: 'MARCAR_LISTO',
      orderId,
      previousStatus: 'EMPAQUETADO',
      newStatus: 'LISTO',
    }).catch((err) => console.error('No se pudo registrar actividad:', err));
  }
}


export async function cancelOrder(orderId: string, incidentReason: string, incidentNotes?: string): Promise<void> {
  const user = auth.currentUser;
  const orderRef = doc(db, "orders", orderId);
  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = itemsSnapshot.docs.map(doc => ({
    itemId: doc.id,
    ...(doc.data() as Omit<OrderItem, "itemId">)
  }));

  await runTransaction(db, async (transaction) => {
    // 1. Gather all reads
    const invRefs = items.map(item => doc(db, "inventory", item.productId));
    const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));

    // 2. Perform all writes
    transaction.update(orderRef, {
      status: "CANCELADO",
      incidentReason,
      incidentNotes: incidentNotes || null,
      updatedAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
    });

    invSnaps.forEach((invSnap, index) => {
      if (!invSnap.exists()) {
        throw new Error(`Inventario no encontrado para el producto: ${items[index].productId}`);
      }

      const invData = invSnap.data();
      const currentAvailable = invData.stockAvailable || 0;
      const currentReserved = invData.stockReserved || 0;
      const qty = items[index].quantity || 0;

      transaction.update(invRefs[index], {
        stockAvailable: currentAvailable + qty,
        stockReserved: Math.max(0, currentReserved - qty),
        updatedAt: serverTimestamp(),
      });
    });
  });

  // ── HU #160: Registrar actividad del vendedor ──
  if (user) {
    const sellerSnap = await getDoc(doc(db, 'users', user.uid));
    const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
    registrarActividadVendedor({
      sellerId: user.uid,
      sellerName: sellerData.displayName ?? 'Vendedor',
      sellerEmail: sellerData.email ?? '',
      actionType: 'CANCELAR',
      orderId,
      previousStatus: 'RESERVADO',
      newStatus: 'CANCELADO',
    }).catch((err) => console.error('No se pudo registrar la actividad:', err));
  }
}

// --- Real-time Subscriptions ---

export function subscribeToCreatedOrders(onUpdate: (orders: Order[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "CREADO")
  );

  return onSnapshot(q, async (querySnapshot) => {
    const orders = await processQuerySnapshot(querySnapshot);
    onUpdate(orders);
  });
}

export function subscribeToSellerOrders(sellerId: string, onUpdate: (orders: Order[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("sellerId", "==", sellerId)
  );

  return onSnapshot(q, async (querySnapshot) => {
    const orders = await processQuerySnapshot(querySnapshot);
    onUpdate(orders);
  });
}

export function subscribeToOrder(
  orderId: string,
  onData: (data: Order) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const orderRef = doc(db, "orders", orderId);
  return onSnapshot(orderRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as Order;
    onData(data);
  }, onError);
}

export async function getSentOrders(): Promise<Order[]> {
  return [];
}

// --- Internal Processing Logic ---


async function processQuerySnapshot(querySnapshot: QuerySnapshot<DocumentData>): Promise<Order[]> {
  const docs = querySnapshot.docs;
  if (docs.length === 0) return [];

  const locationIds = new Set<string>();
  const buyerIds = new Set<string>();
  const deliveryIds = new Set<string>();

  docs.forEach(doc => {
    const data = doc.data() as any;
    if (data.locationId) locationIds.add(data.locationId);
    if (data.buyerId) buyerIds.add(data.buyerId);
    if (data.deliveryId) deliveryIds.add(data.deliveryId);
  });

  const locationMap = new Map<string, string>();
  const userMap = new Map<string, any>();
  const deliveryMap = new Map<string, any>();

  // Parallel fetch of top-level entities
  await Promise.all([
    ...Array.from(locationIds).map(async id => {
      const snap = await getDoc(doc(db, "locations", id));
      if (snap.exists()) locationMap.set(id, (snap.data() as any).label || "Sin etiqueta");
    }),
    ...Array.from(buyerIds).map(async id => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) userMap.set(id, snap.data());
    }),
    ...Array.from(deliveryIds).map(async id => {
      const snap = await getDoc(doc(db, "deliveries", id));
      if (snap.exists()) deliveryMap.set(id, snap.data());
    })
  ]);

  // Now fetch couriers for deliveries
  const courierIds = new Set<string>();
  deliveryMap.forEach(del => {
    if (del.courierId) courierIds.add(del.courierId);
  });

  await Promise.all(
    Array.from(courierIds).map(async id => {
      if (!userMap.has(id)) {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) userMap.set(id, snap.data());
      }
    })
  );

  const stockMap = new Map<string, number>();

  const orders = await Promise.all(docs.map(async orderDoc => {
    const data = orderDoc.data() as any;
    const buyer = userMap.get(data.buyerId);
    const delData = data.deliveryId ? deliveryMap.get(data.deliveryId) : null;
    let courierName = null;
    if (delData?.courierId) {
      courierName = userMap.get(delData.courierId)?.displayName || "Mensajero sin nombre";
    }

    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = await Promise.all(itemsSnapshot.docs.map(async (itemDoc) => {
      const item = itemDoc.data();
      if (!stockMap.has(item.productId)) {
        const invSnap = await getDoc(doc(db, "inventory", item.productId));
        stockMap.set(item.productId, invSnap.exists() ? invSnap.data().stockAvailable || 0 : 0);
      }
      return {
        itemId: itemDoc.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        description: item.description,
        stockAvailable: stockMap.get(item.productId),
      };
    })) as OrderItem[];

    const delivery: Delivery | null = delData ? {
      id: data.deliveryId,
      ...delData,
      courierName
    } : null;

    return {
      id: orderDoc.id,
      ...data,
      buyerName: buyer?.displayName || "Usuario desconocido",
      delivery,
      items,
      incidentReason: data.incidentReason,
      incidentNotes: data.incidentNotes,
    } as Order;
  }));

  return orders.sort((a, b) => b.id.localeCompare(a.id));
}

// --- Buyer Actions (from main) ---

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return null;

  const data = orderSnap.data() as any;

  // We can use a trick to reuse processQuerySnapshot by creating a mock QuerySnapshot
  // but it's cleaner to just call it if we have a list. 
  // For now, let's just use it to fetch this single order's details efficiently.
  const orders = await processQuerySnapshot({ docs: [orderSnap] } as any);
  return orders[0] || null;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return processQuerySnapshot(querySnapshot);
}

export async function confirmOrderReception(orderId: string, buyerId: string) {
  const orderRef = doc(db, "orders", orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("El pedido no existe.");
    }

    const data = orderSnap.data();

    if (data.buyerId !== buyerId) {
      throw new Error("No puedes confirmar la recepción de este pedido.");
    }

    if (data.status !== 'ENTREGADO' && data.deliveryStatus !== 'DELIVERED') {
      throw new Error("Solo puedes confirmar pedidos marcados como entregados.");
    }

    if (data.buyerReceptionConfirmed || data.customerConfirmed) {
      throw new Error("La recepción de este pedido ya fue confirmada.");
    }

    const confirmedAt = serverTimestamp();

    transaction.update(orderRef, {
      buyerReceptionConfirmed: true,
      buyerReceptionConfirmedAt: confirmedAt,
      receptionStatus: "CONFIRMADO_POR_COMPRADOR",
      status: "COMPLETADO",
      updatedAt: confirmedAt,
    });
  });
}

export async function createReturnRequest(requestData: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) {
  try {
    const docRef = await addDoc(collection(db, "returns"), {
      ...requestData,
      status: 'pending_review',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la devolución:", error);
    throw error;
  }
}

export function subscribeToMyOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, async (querySnapshot) => {
    try {
      const orders = await processQuerySnapshot(querySnapshot);
      onUpdate(orders);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error
          : new Error("No se pudieron escuchar tus pedidos.")
      );
    }
  }, onError);
}

export async function getMyReturns(userId: string): Promise<ReturnRequest[]> {
  const q = query(
    collection(db, "returns"),
    where("buyerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ReturnRequest[];
}


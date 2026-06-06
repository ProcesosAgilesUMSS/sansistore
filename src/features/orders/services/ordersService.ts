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
import type { Order, OrderStatus, OrderItem, ReturnRequest } from "@features/orders/types";

// ── HU #160: Monitoreo de actividad de vendedores ──
import { registrarActividadVendedor } from '../../admin/monitoring/services/sellerActivityService';

// --- Seller Actions ---

export async function paidOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No autenticado");

  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    throw new Error("El pedido no existe.");
  }

  const orderData = orderSnap.data() as Record<string, any>;
  if (orderData.status !== "ENTREGADO") {
    throw new Error("Solo se puede validar el pago de pedidos entregados.");
  }

  if (orderData.status === "PAGADO") {
    throw new Error("El pedido ya fue cerrado como pagado.");
  }

  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = itemsSnapshot.docs.map((itemDoc) => ({
    id: itemDoc.id,
    ...(itemDoc.data() as Omit<OrderItem, "itemId">),
  }));

  if (items.length === 0) {
    throw new Error("El pedido no tiene productos asociados.");
  }

  const paymentRef =
    typeof orderData.paymentId === "string" && orderData.paymentId.trim()
      ? doc(db, "payments", orderData.paymentId)
      : null;

  await runTransaction(db, async (transaction) => {
    const invRefs = items.map(item => doc(db, "inventory", item.productId));
    const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));
    const paymentSnap = paymentRef ? await transaction.get(paymentRef) : null;
    const currentOrderSnap = await transaction.get(orderRef);

    if (!currentOrderSnap.exists()) {
      throw new Error("El pedido no existe.");
    }

    const currentOrder = currentOrderSnap.data();
    if (currentOrder.status !== "ENTREGADO") {
      throw new Error("El pedido ya no esta disponible para validar pago.");
    }

    if (currentOrder.status === "PAGADO") {
      throw new Error("El pedido ya fue cerrado como pagado.");
    }

    transaction.update(orderRef, {
      status: "PAGADO",
      paymentStatus: "COBRADO",
      paymentStatusLabel: "Cobrado",
      paymentCollectedAt: serverTimestamp(),
      verifiedAt: serverTimestamp(),
      verifiedBy: user.uid,
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

      if (currentReserved < qty) {
        throw new Error(
          `Reserva insuficiente para el producto: ${items[index].productId}`
        );
      }

      if (currentTotal < qty) {
        throw new Error(
          `Stock total insuficiente para el producto: ${items[index].productId}`
        );
      }

      transaction.update(invRefs[index], {
        stockTotal: currentTotal - qty,
        stockReserved: currentReserved - qty,
        updatedAt: serverTimestamp(),
      });
    });

    if (paymentRef) {
      if (paymentSnap?.exists()) {
        transaction.update(paymentRef, {
          status: "COBRADO",
          statusLabel: "Cobrado",
          amount: typeof currentOrder.total === "number" ? currentOrder.total : 0,
          collectedAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
          collectedBy: user.uid,
          verifiedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(paymentRef, {
          paymentId: orderData.paymentId,
          orderId,
          amount: typeof currentOrder.total === "number" ? currentOrder.total : 0,
          method: currentOrder.paymentMethod ?? "cash_on_delivery",
          status: "COBRADO",
          statusLabel: "Cobrado",
          collectedAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
          collectedBy: user.uid,
          verifiedBy: user.uid,
          registeredBy: currentOrder.sellerId ?? user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }
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

export async function reserveOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe estar autenticado para reservar un pedido.");

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "RESERVADO",
    sellerId: user.uid,
    updatedAt: serverTimestamp(),
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

export async function cancelOrder(orderId: string, incidentReason: string): Promise<void> {
  //camila-160
  const user = auth.currentUser;
  const orderRef = doc(db, "orders", orderId);
  
  await runTransaction(db, async (transaction) => {
    transaction.update(orderRef, {
      status: "CANCELADO",
      incidentReason,
      updatedAt: serverTimestamp(),
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
  const uniqueLocationIds = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => (doc.data() as any).locationId)
        .filter((id): id is string => !!id)
    )
  );
  const uniqueBuyerIds = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => (doc.data() as any).buyerId)
        .filter((id): id is string => !!id)
    )
  );

  const locationMap = new Map<string, string>();
  const buyerNameMap = new Map<string, string>();
  const stockMap = new Map<string, number>();

  await Promise.all([
    ...uniqueLocationIds.map(async (id) => {
      const locSnap = await getDoc(doc(db, "locations", id));
      if (locSnap.exists()) {
        locationMap.set(id, (locSnap.data() as any).label || "Sin etiqueta");
      }
    }),
    ...uniqueBuyerIds.map(async (id) => {
      const userSnap = await getDoc(doc(db, "users", id));
      if (userSnap.exists()) {
        buyerNameMap.set(id, (userSnap.data() as any).displayName || "Sin nombre");
      } else {
        buyerNameMap.set(id, "Usuario desconocido");
      }
    }),
  ]);

  const orders = await Promise.all(
    querySnapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data() as Record<string, any>;
      const destination =
        (data.locationId && locationMap.get(data.locationId)) ||
        "Ubicación no encontrada";
      const buyerName = buyerNameMap.get(data.buyerId) || "Usuario desconocido";

      const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
      const items = await Promise.all(itemsSnapshot.docs.map(async (itemDoc) => {
        const item = itemDoc.data();
        let stockAvailable = 0;

        if (!stockMap.has(item.productId)) {
          const invSnap = await getDoc(doc(db, "inventory", item.productId));
          if (invSnap.exists()) {
            stockMap.set(item.productId, invSnap.data().stockAvailable || 0);
          } else {
            stockMap.set(item.productId, 0);
          }
        }
        stockAvailable = stockMap.get(item.productId) || 0;

        return {
          itemId: itemDoc.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          description: item.description,
          stockAvailable,
        };
      })) as OrderItem[];

      return {
        id: orderDoc.id,
        secret: data.secret,
        buyerId: data.buyerId,
        buyerName,
        sellerId: data.sellerId,
        status: data.status as OrderStatus,
        buyerReceptionConfirmed:
          data.buyerReceptionConfirmed || data.customerConfirmed || false,
        buyerReceptionConfirmedAt:
          data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
        delivery: {
          destination,
        },
        items,
        total: data.total,
        createdAt: data.createdAt,
        incidentReason: data.incidentReason,
      };
    })
  );

  return orders.sort((a, b) => b.id.localeCompare(a.id));
}

// --- Buyer Actions (from main) ---

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return null;

  const data = orderSnap.data() as Record<string, any>;

  let destination = "Ubicación no encontrada";
  if (data.locationId) {
    const locSnap = await getDoc(doc(db, "locations", data.locationId));
    if (locSnap.exists()) {
      destination = (locSnap.data() as any).label || "Sin etiqueta";
    }
  }

  let buyerName = "Usuario desconocido";
  if (data.buyerId) {
    const userSnap = await getDoc(doc(db, "users", data.buyerId));
    if (userSnap.exists()) {
      buyerName = userSnap.data().displayName || "Sin nombre";
    }
  }

  const itemsSnapshot = await getDocs(collection(orderRef, "orderItems"));
  const items = await Promise.all(itemsSnapshot.docs.map(async (itemDoc) => {
    const item = itemDoc.data();
    let stockAvailable = 0;

    const invSnap = await getDoc(doc(db, "inventory", item.productId));
    if (invSnap.exists()) {
      stockAvailable = invSnap.data().stockAvailable || 0;
    }

    return {
      itemId: itemDoc.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      description: item.description,
      stockAvailable,
    };
  })) as OrderItem[];

  return {
    id: orderSnap.id,
    secret: data.secret,
    buyerId: data.buyerId,
    buyerName,
    sellerId: data.sellerId,
    status: data.status as OrderStatus,
    buyerReceptionConfirmed:
      data.buyerReceptionConfirmed || data.customerConfirmed || false,
    buyerReceptionConfirmedAt:
      data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt ?? null,
    delivery: { destination },
    items,
    total: data.total,
    createdAt: data.createdAt,
    incidentReason: data.incidentReason,
  };
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

export async function createReturnRequest(
  requestData: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "returns"), {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la devolución:", error);
    throw error;
  }
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


//Revisa @src/features/orders/components/OrderActions.tsx implementé un nuevo order.status === "ENTREGADO", actualizo una order con ese estado a "PAGADO",
//   pero necesito ampliar el metodo que hace eso en @src/features/orders/services/ordersService.ts [el metodo paidOrder()), necesito que si la orden esta
//   pagada, ademas de actualizar el estado de la orden (de ENTREGADO A PAGADO), necesito actualizar el inventario de los productos que tiene esa orden, por
//   cada producto, deberia ir al inventario (que tienen el mismo atributo) y cuando actualizar stockTotal -= stockReserved (o tambien puede ser quantity de el
//   orderItem) y stockReserved -= stockReserved

import { collection, query, where, getDocs, doc, getDoc, type Query, type DocumentData, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Order, OrderStatus } from "../types";

interface FirestoreOrder {
  locationId?: string;
  deliveryStatus?: string;
  status: string;
  total?: number;
}

interface FirestoreLocation {
  label?: string;
}

interface FirestoreOrderItem {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  description?: string;
}

export async function reserveOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "RESERVADO"
  });
}

export async function getSentOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("deliveryStatus", "in", ["in_transit", "delivered"])
  );
  return fetchOrdersByQuery(q);
}

export async function getCreatedOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["CREADO", "RESERVADO", "EMPAQUETADO", "PENDIENTE"]),
    where("deliveryStatus", "==", null)
  );
  return fetchOrdersByQuery(q);
}

async function fetchOrdersByQuery(q: Query<DocumentData>): Promise<Order[]> {
  const querySnapshot = await getDocs(q);

  // Optimización: Obtener todas las ubicaciones únicas primero para evitar N+1
  const uniqueLocationIds = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => (doc.data() as FirestoreOrder).locationId)
        .filter((id): id is string => !!id)
    )
  );

  const locationMap = new Map<string, string>();
  if (uniqueLocationIds.length > 0) {
    await Promise.all(
      uniqueLocationIds.map(async (id) => {
        const locSnap = await getDoc(doc(db, "locations", id));
        if (locSnap.exists()) {
          locationMap.set(id, (locSnap.data() as FirestoreLocation).label || "Sin etiqueta");
        }
      })
    );
  }

  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data() as FirestoreOrder;
    const destination = (data.locationId && locationMap.get(data.locationId)) || "Ubicación no encontrada";

    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = itemsSnapshot.docs.map(itemDoc => {
      const itemData = itemDoc.data() as FirestoreOrderItem;
      return {
        itemId: itemData.itemId,
        productId: itemData.productId,
        productName: itemData.productName,
        price: itemData.unitPrice,
        quantity: itemData.quantity,
        subtotal: itemData.subtotal,
        description: itemData.description
      };
    });

    // Si deliveryStatus existe y no es "created", lo usamos como el estado visible.
    const orderStatus = (data.deliveryStatus ? data.deliveryStatus : data.status) as OrderStatus;

    return {
      id: orderDoc.id,
      status: orderStatus,
      delivery: {
        destination
      },
      items,
      total: data.total
    };
  }));

  return orders.sort((a, b) => b.id.localeCompare(a.id));
}

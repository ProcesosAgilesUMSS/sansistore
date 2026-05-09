import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Order, OrderStatus, OrderItem } from "../types";

export async function getSentOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("deliveryStatus", "in", ["in_transit", "delivered"])
  );
  const querySnapshot = await getDocs(q);

  const orders = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
    const data = orderDoc.data();
    let destination = "Ubicación no encontrada";
    if (data.locationId) {
      const locRef = doc(db, "locations", data.locationId);
      const locSnap = await getDoc(locRef);
      if (locSnap.exists()) {
        destination = locSnap.data().label || "Sin etiqueta";
      }
    }
    const itemsSnapshot = await getDocs(collection(orderDoc.ref, "orderItems"));
    const items = itemsSnapshot.docs.map(itemDoc => ({
      ...itemDoc.data()
    })) as OrderItem[];

    return {
      id: orderDoc.id,
      status: data.deliveryStatus as OrderStatus,
      delivery: {
        destination: destination
      },
      items,
      total: data.total
    };
  }));

  return orders;
}

import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Order, OrderStatus } from "../types";

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
    return {
      id: orderDoc.id,
      status: data.deliveryStatus as OrderStatus,
      delivery: {
        destination: destination
      }
    };
  }));

  return orders;
}

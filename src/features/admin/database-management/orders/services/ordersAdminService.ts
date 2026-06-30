import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import type { AdminOrder, UpdateOrderPayload } from "../types";

const COLLECTION = "orders";

export async function getOrders(): Promise<AdminOrder[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminOrder[];
}

export async function updateOrder(
  orderId: string,
  payload: UpdateOrderPayload
): Promise<void> {
  const ref = doc(db, COLLECTION, orderId);
  await updateDoc(ref, {
    ...payload,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  const ref = doc(db, COLLECTION, orderId);
  await deleteDoc(ref);
}
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeliveryReview } from "@features/orders/types";

const COLLECTION = "deliveryReviews";

export async function getDeliveryReviewForOrder(
  orderId: string
): Promise<DeliveryReview | null> {
  const q = query(
    collection(db, COLLECTION),
    where("orderId", "==", orderId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const reviewDoc = snapshot.docs[0];
  return { id: reviewDoc.id, ...(reviewDoc.data() as Omit<DeliveryReview, "id">) };
}

export async function createDeliveryReview(input: {
  orderId: string;
  courierId: string | null;
  buyerId: string;
  buyerName?: string;
  rating: number;
}): Promise<string> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("La calificación debe estar entre 1 y 5 estrellas.");
  }

  const existing = await getDeliveryReviewForOrder(input.orderId);
  if (existing) {
    throw new Error("Este pedido ya fue calificado.");
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    orderId: input.orderId,
    courierId: input.courierId,
    buyerId: input.buyerId,
    buyerName: input.buyerName ?? null,
    rating: input.rating,
    comment: "",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function addDeliveryReviewComment(
  reviewId: string,
  comment: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, reviewId), {
    comment: comment.trim(),
    updatedAt: serverTimestamp(),
  });
}

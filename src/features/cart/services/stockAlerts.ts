import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export async function subscribeToStockAlert(
  productId: string,
  userId: string
): Promise<void> {
  const ref = doc(db, 'stockAlerts', productId, 'subscribers', userId);
  await setDoc(ref, {
    userId,
    productId,
    createdAt: serverTimestamp(),
  });
}

export async function unsubscribeFromStockAlert(
  productId: string,
  userId: string
): Promise<void> {
  const ref = doc(db, 'stockAlerts', productId, 'subscribers', userId);
  await deleteDoc(ref);
}

export async function isSubscribedToStockAlert(
  productId: string,
  userId: string
): Promise<boolean> {
  const ref = doc(db, 'stockAlerts', productId, 'subscribers', userId);
  const snap = await getDoc(ref);
  return snap.exists();
}
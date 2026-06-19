import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { LocalCartItem } from '../types';

function cartCol(uid: string) {
  return collection(db, 'users', uid, 'cartItems');
}

export async function syncCartToFirestore(uid: string, items: LocalCartItem[]): Promise<void> {
  const batch = writeBatch(db);
  const colRef = cartCol(uid);
  const snap = await getDocs(colRef);
  snap.docs.forEach((d) => batch.delete(d.ref));
  items.forEach((item) => {
    const ref = doc(colRef, item.productId);
    const payload: Record<string, unknown> = {
      cartItemId: item.productId,
      userId: uid,
      productId: item.productId,
      quantity: item.quantity,
      updatedAt: serverTimestamp(),
    };
    if (typeof item.priceAtAdd === 'number') {
      payload.priceAtAdd = item.priceAtAdd;
    }
    batch.set(ref, payload);
  });
  await batch.commit();
}

export async function upsertCartItem(uid: string, productId: string, quantity: number, priceAtAdd?: number): Promise<void> {
  const ref = doc(db, 'users', uid, 'cartItems', productId);
  const payload: Record<string, unknown> = {
    cartItemId: productId,
    userId: uid,
    productId,
    quantity,
    updatedAt: serverTimestamp(),
  };
  if (typeof priceAtAdd === 'number') {
    payload.priceAtAdd = priceAtAdd;
  }
  await setDoc(ref, payload, { merge: true });
}

export async function deleteCartItem(uid: string, productId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'cartItems', productId);
  await deleteDoc(ref);
}

export async function clearCartFirestore(uid: string): Promise<void> {
  const batch = writeBatch(db);
  const colRef = cartCol(uid);
  const snap = await getDocs(colRef);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
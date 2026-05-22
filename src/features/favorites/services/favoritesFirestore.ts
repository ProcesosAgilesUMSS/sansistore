import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { FavoriteItem } from '../types';

function favoritesCol(uid: string) {
  return collection(db, 'users', uid, 'favoriteItems');
}

export async function getFavoriteItems(uid: string): Promise<FavoriteItem[]> {
  const snap = await getDocs(favoritesCol(uid));
  return snap.docs.map((favoriteDoc) => ({
    productId: String(favoriteDoc.data().productId || favoriteDoc.id),
    userId: uid,
    createdAt: favoriteDoc.data().createdAt?.toMillis?.() ?? Date.now(),
  }));
}

export async function syncFavoritesToFirestore(
  uid: string,
  items: FavoriteItem[]
): Promise<void> {
  const batch = writeBatch(db);
  const colRef = favoritesCol(uid);

  items.forEach((item) => {
    const ref = doc(colRef, item.productId);
    batch.set(ref, {
      productId: item.productId,
      userId: uid,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function upsertFavoriteItem(
  uid: string,
  productId: string
): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favoriteItems', productId), {
    productId,
    userId: uid,
    createdAt: serverTimestamp(),
  });
}

export async function deleteFavoriteItem(
  uid: string,
  productId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favoriteItems', productId));
}

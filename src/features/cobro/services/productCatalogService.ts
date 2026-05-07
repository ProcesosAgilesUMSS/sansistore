import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { CobroProduct } from '../types';

export const getCheckoutProducts = async (): Promise<CobroProduct[]> => {
  const productsQuery = query(
    collection(db, 'products'),
    orderBy('createdAt', 'desc'),
    limit(4)
  );
  const snap = await getDocs(productsQuery);

  return snap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CobroProduct)
    .filter((product) => product.active !== false);
};

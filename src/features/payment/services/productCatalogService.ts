import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { CobroProduct } from '../types';

export const getCheckoutProducts = async (): Promise<CobroProduct[]> => {
  const productsQuery = query(
    collection(db, 'products'),
    where('active', '==', true)
  );
  const snapshot = await getDocs(productsQuery);

  return snapshot.docs
    .map((productDoc) => {
      const data = productDoc.data();

      return {
        id: productDoc.id,
        name: String(data.name ?? 'Producto sin nombre'),
        price: Number(data.price ?? 0),
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
        active: data.active !== false,
        hasOffer: Boolean(data.hasOffer),
        offerPrice:
          typeof data.offerPrice === 'number' ? data.offerPrice : undefined,
        quantity: 1,
      } satisfies CobroProduct;
    })
    .filter((product) => product.price > 0);
};

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../lib/firebase';

// Tipo para los datos de una Oferta
export interface OfferData {
  productId: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
}

// Tipo para los productos que se muestran en el selector
export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

// Obtiene los productos activos desde Firestore para el selector del formulario
export const getProductsService = async (): Promise<ProductOption[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('active', '==', true),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      name: d.data().name as string,
      price: d.data().price as number,
    }));
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
};

// Actualiza el documento del producto para que aparezca en el filtro de ofertas
const updateProductWithOffer = async (
  productId: string,
  originalPrice: number,
  discountPercent: number
) => {
  const offerPrice = parseFloat(
    (originalPrice * (1 - discountPercent / 100)).toFixed(2)
  );
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    hasOffer: true,
    offerPrice,
    badge: 'Oferta',
    updatedAt: serverTimestamp(),
  });
};

// Guarda una nueva oferta en Firestore y actualiza el producto correspondiente
export const createOfferService = async (
  data: OfferData,
  originalPrice: number
) => {
  try {
    const offersCollection = collection(db, 'offers');

    const docRef = await addDoc(offersCollection, {
      productId: data.productId,
      discount: data.discount,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdAt: serverTimestamp(),
    });

    // Actualiza hasOffer, offerPrice y badge en el producto
    await updateProductWithOffer(data.productId, originalPrice, data.discount);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear la oferta:', error);
    return { success: false, error };
  }
};
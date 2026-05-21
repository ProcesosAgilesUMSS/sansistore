import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../../../lib/firebase';

// 1. Definimos las "reglas" de qué datos componen una Oferta (TypeScript)
export interface OfferData {
  productId: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
}

// 2. Creamos la función que guarda los datos
export const createOfferService = async (data: OfferData) => {
  try {
    
    const offersCollection = collection(db, 'offers');

    // Guardamos el documento nuevo
    const docRef = await addDoc(offersCollection, {
      productId: data.productId,
      discount: data.discount,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdAt: serverTimestamp(), 
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear la oferta:", error);
    return { success: false, error };
  }
};
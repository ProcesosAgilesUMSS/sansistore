import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// ATENCIÓN: Esta ruta asume que la configuración de Firebase está en src/lib/firebase.ts
// Si tu equipo la puso en otro lado, tendremos que ajustar esta línea.
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
    // Apuntamos a la "carpeta" (colección) llamada 'offers' en tu base de datos
    const offersCollection = collection(db, 'offers');

    // Guardamos el documento nuevo
    const docRef = await addDoc(offersCollection, {
      productId: data.productId,
      discount: data.discount,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdAt: serverTimestamp(), // Esto guarda la fecha y hora exacta en la que se creó
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear la oferta:", error);
    return { success: false, error };
  }
};
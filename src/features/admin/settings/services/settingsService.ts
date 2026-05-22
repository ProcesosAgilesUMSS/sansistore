import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { Settings, UpdateSettingsInput } from '../types';

// Colección: settings | Documento singleton: config
// Este documento es único en todo el sistema — nunca se crean más documentos
const COLLECTION = 'settings';
const DOC_ID = 'config';

// Obtener la configuración actual
// Si el documento no existe aún, retorna valores por defecto
export const getSettings = async (): Promise<Settings> => {
  const ref = doc(db, COLLECTION, DOC_ID);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    // Documento no existe todavía — retornamos valores por defecto
    return { reservationTimeLimit: 30 };
  }

  return snapshot.data() as Settings;
};

// Actualizar la configuración
// Usamos setDoc con merge:true para crear el doc si no existe
// o actualizarlo si ya existe — sin borrar otros campos futuros
export const updateSettings = async (input: UpdateSettingsInput): Promise<void> => {
  const ref = doc(db, COLLECTION, DOC_ID);
  await setDoc(ref, { reservationTimeLimit: input.reservationTimeLimit }, { merge: true });
};
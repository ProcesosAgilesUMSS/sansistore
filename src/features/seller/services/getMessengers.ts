import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { Messenger } from "../types";

export const getMessengers = async (db: Firestore): Promise<Messenger[]> => {
  const q = query(
    collection(db, 'users'),
    where('roles', 'array-contains', 'mensajero'),
    where('isActive', '==', true),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName ?? data.email ?? 'Mensajero',
      institutionalId: data.institutionalId ?? '',
    };
  });
}

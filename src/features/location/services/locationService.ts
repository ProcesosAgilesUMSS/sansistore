import { db } from "../../../lib/firebase";
import { addDoc, collection, query, where, deleteDoc, doc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
import type { Location } from "../types";

export async function saveLocation(location: Location) {
    await addDoc(collection(db, "locations"), location);
}


export function subscribeToUserLocations(
    userId: string,
    onData: (locations: Location[]) => void
): () => void {
    const q = query(
        collection(db, 'locations'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Location[];

        onData(data);
    });
}


export async function deleteLocation(locationId: string): Promise<void> {
    await deleteDoc(doc(db, 'locations', locationId));
}


export async function setDefaultLocation(userId: string, locationId: string): Promise<void> {
    const batch = writeBatch(db);

    const q = query(collection(db, 'locations'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { isDefault: false });
    });

    batch.update(doc(db, 'locations', locationId), { isDefault: true });
    await batch.commit();
}

import { db } from "../../../lib/firebase";
import { addDoc, collection, query, where, onSnapshot } from "firebase/firestore";
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

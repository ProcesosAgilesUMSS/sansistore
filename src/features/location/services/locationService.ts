import { db } from "../../../lib/firebase";
import { addDoc, collection, query, where, deleteDoc, doc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
import type { Location } from "../types";
import { updateDoc } from "firebase/firestore";

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

export async function updateLocation(
    locationId: string,
    data: {
        lat: number;
        lng: number;
        label: string;
        type: string;
    }
): Promise<void> {
    const locationRef = doc(db, "locations", locationId);
    await updateDoc(locationRef, {
        ...data,
        updatedAt: new Date().toISOString(), 
    });
}

//bloqueo edicion/eliminacion segun delivery status
export async function hasActiveOrders(locationId: string): Promise<boolean> {
    const activeStatuses = ['assigned', 'accepted', 'in_transit', 'pending_reassignment'];
    const q = query(
        collection(db, "orders"),
        where("locationId", "==", locationId),
        where("deliveryStatus", "in", activeStatuses)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

export async function getSellerLocation(orderId: string): Promise<string | null> {
    const ordersQuery = query(
        collection(db, 'orders'),
        where('orderId', '==', orderId)
    );
    const orderSnapshot = await getDocs(ordersQuery);

    if (orderSnapshot.empty) return null;

    const sellerId = orderSnapshot.docs[0].data().sellerId as string;

    const locationQuery = query(
        collection(db, 'locations'),
        where('userId', '==', sellerId),
        where('isDefault', '==', true)
    );
    const locationSnapshot = await getDocs(locationQuery);

    if (locationSnapshot.empty) return null;

    const { lat, lng } = locationSnapshot.docs[0].data();
    return `https://www.google.com/maps?q=${lat},${lng}`;
}
import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { Messenger } from "../types";

interface BaseMessenger {
  uid: string;
  displayName: string;
  institutionalId: string;
}

export const subscribeToMessengers = (
  db: Firestore,
  onData: (messengers: Messenger[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe => {
  let baseMessengers: BaseMessenger[] = [];
  let busyCourierCounts: Record<string, number> = {};
  let messengersLoaded = false;
  let deliveriesLoaded = false;

  const emit = () => {
    if (!messengersLoaded || !deliveriesLoaded) return;

    const result: Messenger[] = baseMessengers.map((m) => {
      const activeCount = busyCourierCounts[m.uid] ?? 0;
      return {
        ...m,
        isAvailable: activeCount === 0,
      };
    });

    onData(result);
  };

  const messengersQ = query(
    collection(db, "users"),
    where("roles", "array-contains", "mensajero"),
    where("isActive", "==", true),
  );

  const unsubMessengers = onSnapshot(
    messengersQ,
    (snap) => {
      baseMessengers = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data.displayName ?? data.email ?? "Mensajero",
          institutionalId: data.institutionalId ?? "",
        };
      });
      messengersLoaded = true;
      emit();
    },
    (err) => onError?.(err),
  );

  const deliveriesQ = query(
    collection(db, "deliveries"),
    where("status", "in", ["accepted", "in_transit"]),
  );

  const unsubDeliveries = onSnapshot(
    deliveriesQ,
    (snap) => {
      const counts: Record<string, number> = {};
      for (const doc of snap.docs) {
        const courierId = doc.data().courierId as string | undefined;
        if (!courierId) continue;
        counts[courierId] = (counts[courierId] ?? 0) + 1;
      }
      busyCourierCounts = counts;
      deliveriesLoaded = true;
      emit();
    },
    (err) => onError?.(err),
  );

  return () => {
    unsubMessengers();
    unsubDeliveries();
  };
};

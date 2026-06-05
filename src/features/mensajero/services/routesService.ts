import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export type RouteStatus = 'disponible' | 'en curso' | 'completada';

export interface CampusRoute {
  id: string;
  zone: string;
  status: RouteStatus;
  estimatedTime: number;
  courierId: string | null;
  startPoint: { label: string; lat: number; lng: number; };
  endPoint: { label: string; lat: number; lng: number; locationId?: string; };
  createdAt: any;
}

export async function getAvailableRoutes(): Promise<CampusRoute[]> {
  const q = query(
    collection(db, "routes"),
    where("status", "==", "disponible")
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CampusRoute[];
}

export async function takeRoute(routeId: string, courierId: string): Promise<void> {
  const routeRef = doc(db, "routes", routeId);
  await updateDoc(routeRef, {
    status: "en curso",
    courierId: courierId
  });
}

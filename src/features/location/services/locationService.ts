import { db } from "../../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import type { Location } from "../types";

export async function saveLocation(location: Location) {
  console.log("FIREBASE WRITE:", location);
  await addDoc(collection(db, "locations"), location);
}
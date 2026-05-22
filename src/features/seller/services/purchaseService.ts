import {
  collection,
  getDocs,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface ProductForPurchase {
  id: string;
  name: string;
  price: number;
}

export interface PurchaseData {
  productId: string;
  quantity: number;
  unitCost: number;
  purchaseDate: string;
  supplier?: string;
  sellerId: string;
}

export const getSellerProducts = async (sellerId: string): Promise<ProductForPurchase[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const snap = await getDocs(q);

    return snap.docs
      .filter((d) => {
        const data = d.data();
        return !data.sellerId || data.sellerId === sellerId;
      })
      .map((d) => ({
        id: d.id,
        name: d.data().name as string,
        price: d.data().price as number,
      }));
  } catch {
    return [];
  }
};

export const registerPurchase = async (data: PurchaseData): Promise<void> => {
  const batch = writeBatch(db);

  const purchaseRef = doc(collection(db, 'purchases'));
  batch.set(purchaseRef, {
    productId: data.productId,
    quantity: data.quantity,
    unitCost: data.unitCost,
    totalCost: data.quantity * data.unitCost,
    purchaseDate: data.purchaseDate,
    supplier: data.supplier ?? null,
    sellerId: data.sellerId,
    createdAt: serverTimestamp(),
  });

  const inventoryRef = doc(db, 'inventory', data.productId);
  batch.update(inventoryRef, {
    stockAvailable: increment(data.quantity),
    stockTotal: increment(data.quantity),
    updatedAt: serverTimestamp(),
  });

  const movementRef = doc(collection(db, 'inventoryMovements'));
  batch.set(movementRef, {
    productId: data.productId,
    type: 'INGRESO_COMPRA',
    quantity: data.quantity,
    reason: `Compra registrada${data.supplier ? ` - Proveedor: ${data.supplier}` : ''}`,
    sellerId: data.sellerId,
    purchaseId: purchaseRef.id,
    date: data.purchaseDate,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
};

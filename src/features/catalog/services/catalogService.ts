import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getSoldCount } from '../../../lib/productPopularity';
import type { CatalogInventory, CatalogProduct } from '../types';

export async function fetchCatalogProducts() {
  const productsQuery = query(
    collection(db, 'products'),
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const [productsSnap, inventorySnap] = await Promise.all([
    getDocs(productsQuery),
    getDocs(collection(db, 'inventory')),
  ]);

  const inventoryByProductId = new Map(
    inventorySnap.docs.map((inventoryDoc) => {
      const inventory = {
        id: inventoryDoc.id,
        ...inventoryDoc.data(),
      } as CatalogInventory;
      return [inventory.productId ?? inventoryDoc.id, inventory];
    })
  );

  return productsSnap.docs.map((productDoc) => {
    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    } as CatalogProduct;
    const inventory = inventoryByProductId.get(productDoc.id);

    return {
      ...product,
      soldCount: getSoldCount(product),
      stockAvailable: inventory?.stockAvailable ?? 0,
      stockReserved: inventory?.stockReserved ?? 0,
      stockTotal: inventory?.stockTotal ?? 0,
      enabled: inventory?.enabled ?? false,
    };
  });
}

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface CatalogCategory {
  id: string;
  name: string;
  active?: boolean;
}

export async function fetchCatalogCategories() {
  const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
  const snap = await getDocs(categoriesQuery);

  return snap.docs
    .map((categoryDoc) => ({
      id: categoryDoc.id,
      ...categoryDoc.data(),
    }) as CatalogCategory)
    .filter((category) => category.active !== false);
}

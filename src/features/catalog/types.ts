import type { Timestamp } from 'firebase/firestore';

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
  description?: string;
  badge?: string;
  stockAvailable?: number;
  stockReserved?: number;
  stockTotal?: number;
  enabled?: boolean;
  categoryId?: string;
  createdAt?: Timestamp | string | Date | null;
  soldCount?: number;
}

export interface CatalogInventory {
  id: string;
  productId?: string;
  stockAvailable?: number;
  stockReserved?: number;
  stockTotal?: number;
  enabled?: boolean;
}

export type CatalogSort = 'best-sellers' | 'recent' | 'name-asc' | 'name-desc';

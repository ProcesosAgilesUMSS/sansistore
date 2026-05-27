import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  badge?: string | null;
  hasOffer?: boolean;
  offerPrice?: number | null;
  active?: boolean;
  stockAvailable?: number;
  stockReserved?: number;
  stockTotal?: number;
  enabled?: boolean;
  soldCount?: number;
}

export interface Review {
  id: string;
  authorName?: string;
  authorId?: string;
  authorPhotoUrl?: string | null;
  comment: string;
  rating: number;
  active?: boolean;
  createdAt?: Timestamp | string | null;
}

export interface ProductDetailProps {
  productSlug: string;
  initialProduct?: string;
}

export interface InventoryRecord {
  productId: string;
  stockAvailable?: number;
  stockReserved?: number;
  stockTotal?: number;
  enabled?: boolean;
}

export type ReviewSortKey = 'recent' | 'oldest' | 'highest' | 'lowest';

export const REVIEW_PAGE_SIZE = 10;
export const PRODUCT_NAME_MAX_LINES = 3;
export const PRODUCT_DESCRIPTION_MAX_LINES = 7;
export const PRODUCT_NAME_EXPAND_LENGTH = 45;
export const PRODUCT_DESCRIPTION_EXPAND_LENGTH = 320;
